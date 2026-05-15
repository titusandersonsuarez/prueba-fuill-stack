import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { JwtPayload, Role } from '@prescriptions/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/auth-response.dto';

const BCRYPT_ROUNDS = 10;
const REFRESH_COOKIE = 'refresh_token';

interface RefreshTokenPayload extends JwtPayload {
  family: string;
  tokenId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto, res: Response): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Credenciales inválidas');

    const family = uuidv4();
    const tokenId = uuidv4();
    const role = user.role as Role;

    const accessToken = this.signAccess({ sub: user.id, email: user.email, role });
    const refreshToken = this.signRefresh({
      sub: user.id,
      email: user.email,
      role,
      family,
      tokenId,
    });

    await this.storeRefreshToken(user.id, refreshToken, family);
    this.setRefreshCookie(res, refreshToken);

    return { accessToken, user: { id: user.id, email: user.email, role } };
  }

  async refresh(rawToken: string, res: Response): Promise<{ accessToken: string }> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (!payload.family || !payload.tokenId) {
      throw new UnauthorizedException('Refresh token malformado');
    }

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { family: payload.family, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!stored) {
      await this.revokeFamily(payload.family);
      throw new UnauthorizedException('Sesión inválida');
    }

    if (stored.tokenHash !== tokenHash) {
      // Token reuse — revoke entire family
      await this.revokeFamily(payload.family);
      throw new UnauthorizedException('Reutilización de token detectada');
    }

    if (new Date() > stored.expiresAt) {
      await this.revokeFamily(payload.family);
      throw new UnauthorizedException('Sesión expirada');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const newTokenId = uuidv4();
    const accessToken = this.signAccess({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
    const newRefresh = this.signRefresh({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      family: payload.family,
      tokenId: newTokenId,
    });

    await this.storeRefreshToken(payload.sub, newRefresh, payload.family);
    this.setRefreshCookie(res, newRefresh);

    return { accessToken };
  }

  async logout(userId: string, rawToken: string | undefined, res: Response): Promise<void> {
    if (rawToken) {
      try {
        const payload = this.jwt.verify<RefreshTokenPayload>(rawToken, {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });
        await this.revokeFamily(payload.family);
      } catch {
        // Token expired/invalid — still revoke all sessions for the user
        await this.revokeAllUserSessions(userId);
      }
    } else {
      await this.revokeAllUserSessions(userId);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  private signAccess(payload: JwtPayload): string {
    const expiresIn = Math.floor(
      this.parseExpiryMs(this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m')) / 1000,
    );
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn,
    });
  }

  private signRefresh(payload: RefreshTokenPayload): string {
    const expiresIn = Math.floor(
      this.parseExpiryMs(this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')) / 1000,
    );
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn,
    });
  }

  private async storeRefreshToken(userId: string, token: string, family: string): Promise<void> {
    const expiresAt = this.parseExpiry(this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'));
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.hashToken(token), family, expiresAt },
    });
  }

  private async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private setRefreshCookie(res: Response, token: string): void {
    const maxAge = this.parseExpiryMs(this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'));
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });
  }

  private parseExpiry(expiry: string): Date {
    return new Date(Date.now() + this.parseExpiryMs(expiry));
  }

  private parseExpiryMs(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    if (unit === 'd') return value * 86_400_000;
    if (unit === 'h') return value * 3_600_000;
    return value * 60_000;
  }
}
