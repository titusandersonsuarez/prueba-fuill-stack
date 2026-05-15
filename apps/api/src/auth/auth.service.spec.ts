import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prescriptions/shared';

// Jest 30 no puede hacer spyOn en propiedades no-configurables de módulos CJS.
// Mockeamos el módulo manteniendo hash real y compare como jest.fn().
jest.mock('bcrypt', () => ({
  ...jest.requireActual<typeof import('bcrypt')>('bcrypt'),
  compare: jest.fn(),
}));

const mockUser = {
  id: 'user-id-1',
  email: 'doctor@test.com',
  password: '$2b$10$hashedpassword',
  role: Role.DOCTOR,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const cfg: Record<string, string> = {
      JWT_ACCESS_SECRET: 'access-secret-32-chars-minimum-here',
      JWT_REFRESH_SECRET: 'refresh-secret-32-chars-minimum-here',
    };
    return cfg[key];
  }),
  get: jest.fn((key: string, fallback?: string) => {
    const cfg: Record<string, string> = {
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      NODE_ENV: 'test',
    };
    return cfg[key] ?? fallback;
  }),
};

const mockResponse = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as import('express').Response;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwt.sign.mockReturnValue('signed-token');
  });

  describe('login', () => {
    it('retorna accessToken y user cuando las credenciales son válidas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(
        { email: mockUser.email, password: 'password123' },
        mockResponse,
      );

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.role).toBe(Role.DOCTOR);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'pass' }, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({ email: mockUser.email, password: 'wrong' }, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const validPayload = {
      sub: 'user-id-1',
      email: 'doctor@test.com',
      role: Role.DOCTOR,
      family: 'family-uuid',
      tokenId: 'token-uuid',
    };

    const storedToken = {
      id: 'stored-id',
      tokenHash: '', // set per test
      expiresAt: new Date(Date.now() + 86_400_000),
      family: 'family-uuid',
      revokedAt: null,
    };

    it('rota el token y devuelve nuevo accessToken', async () => {
      const rawToken = 'raw-refresh-token';
      mockJwt.verify.mockReturnValue(validPayload);

      // Compute real hash to match
      const { createHash } = await import('crypto');
      const hash = createHash('sha256').update(rawToken).digest('hex');
      mockPrisma.refreshToken.findFirst.mockResolvedValue({ ...storedToken, tokenHash: hash });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh(rawToken, mockResponse);

      expect(result.accessToken).toBe('signed-token');
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revokedAt: expect.any(Date) } }),
      );
      expect(mockResponse.cookie).toHaveBeenCalled();
    });

    it('lanza UnauthorizedException si no hay token almacenado para la familia', async () => {
      mockJwt.verify.mockReturnValue(validPayload);
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      await expect(service.refresh('any-token', mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('revoca la familia y lanza error si el hash no coincide (reuse)', async () => {
      mockJwt.verify.mockReturnValue(validPayload);
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        ...storedToken,
        tokenHash: 'different-hash',
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      await expect(service.refresh('stale-token', mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { family: 'family-uuid', revokedAt: null } }),
      );
    });

    it('lanza UnauthorizedException si el JWT de refresh es inválido', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad-token', mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('revoca la familia del token y limpia la cookie', async () => {
      const validPayload = {
        sub: 'user-id-1',
        email: 'x@x.com',
        role: Role.DOCTOR,
        family: 'fam-1',
        tokenId: 't-1',
      };
      mockJwt.verify.mockReturnValue(validPayload);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      await service.logout('user-id-1', 'raw-refresh', mockResponse);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { family: 'fam-1', revokedAt: null } }),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
    });

    it('revoca todas las sesiones si el token es inválido', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('expired');
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      await service.logout('user-id-1', 'bad-token', mockResponse);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-id-1', revokedAt: null } }),
      );
    });
  });

  describe('hashPassword', () => {
    it('retorna un hash bcrypt válido', async () => {
      const hash = await service.hashPassword('mypassword');
      expect(hash).toMatch(/^\$2b\$/);
      // Usar bcrypt real para verificar el hash (compare está mockeado a nivel de módulo)
      const realBcrypt = jest.requireActual<typeof import('bcrypt')>('bcrypt');
      const match = await realBcrypt.compare('mypassword', hash);
      expect(match).toBe(true);
    });
  });
});
