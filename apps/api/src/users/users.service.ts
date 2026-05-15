import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { PaginatedResponse, Role } from '@prescriptions/shared';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';

const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  doctor: {
    select: { id: true, firstName: true, lastName: true, speciality: true, licenseNumber: true },
  },
  patient: {
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true, phone: true },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
  ) {}

  async findAll(dto: ListUsersDto): Promise<PaginatedResponse<unknown>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(dto);

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private buildWhereClause(dto: ListUsersDto) {
    const where: Record<string, unknown> = {};

    if (dto.role) where['role'] = dto.role;

    if (dto.search) {
      const contains = { contains: dto.search, mode: 'insensitive' as const };
      where['OR'] = [
        { email: contains },
        { doctor: { is: { firstName: contains } } },
        { doctor: { is: { lastName: contains } } },
        { patient: { is: { firstName: contains } } },
        { patient: { is: { lastName: contains } } },
      ];
    }

    return where;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya está registrado');

    const passwordHash = await this.auth.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        role: dto.role,
        ...(dto.role === Role.DOCTOR && {
          doctor: {
            create: {
              firstName: dto.firstName!,
              lastName: dto.lastName!,
              speciality: dto.speciality!,
              licenseNumber: dto.licenseNumber!,
            },
          },
        }),
        ...(dto.role === Role.PATIENT && {
          patient: {
            create: {
              firstName: dto.firstName!,
              lastName: dto.lastName!,
              ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
              ...(dto.phone ? { phone: dto.phone } : {}),
            },
          },
        }),
      },
      select: USER_SELECT,
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const taken = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (taken) throw new ConflictException('El email ya está en uso');
    }

    const data: { email?: string; password?: string } = {};
    if (dto.email) data.email = dto.email;
    if (dto.password) data.password = await this.auth.hashPassword(dto.password);

    return this.prisma.user.update({ where: { id }, data, select: USER_SELECT });
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        doctor: { select: { id: true, _count: { select: { prescriptions: true } } } },
        patient: { select: { id: true, _count: { select: { prescriptions: true } } } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const doctorRxs = user.doctor?._count.prescriptions ?? 0;
    const patientRxs = user.patient?._count.prescriptions ?? 0;

    if (doctorRxs > 0) {
      throw new ConflictException(
        `No se puede eliminar: el médico tiene ${doctorRxs} receta(s) registrada(s). La historia clínica debe conservarse.`,
      );
    }
    if (patientRxs > 0) {
      throw new ConflictException(
        `No se puede eliminar: el paciente tiene ${patientRxs} receta(s) registrada(s). La historia clínica debe conservarse.`,
      );
    }

    await this.prisma.user.delete({ where: { id } });
  }
}
