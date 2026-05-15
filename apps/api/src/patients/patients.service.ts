import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload, PaginatedResponse, Role } from '@prescriptions/shared';
import { ListPatientsDto } from './dto/list-patients.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

const PATIENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  phone: true,
  user: { select: { id: true, email: true, createdAt: true } },
} as const;

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: ListPatientsDto): Promise<PaginatedResponse<unknown>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(dto);

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        skip,
        take: limit,
        where,
        select: PATIENT_SELECT,
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private buildWhereClause(dto: ListPatientsDto) {
    const where: Record<string, unknown> = {};

    if (dto.search) {
      const contains = { contains: dto.search, mode: 'insensitive' as const };
      where['OR'] = [
        { firstName: contains },
        { lastName: contains },
        { user: { email: contains } },
      ];
    }

    return where;
  }

  async findOne(id: string, requester: JwtPayload) {
    const patient = await this.prisma.patient.findUnique({ where: { id }, select: PATIENT_SELECT });
    if (!patient) throw new NotFoundException('Paciente no encontrado');

    if (requester.role === Role.PATIENT && patient.user.id !== requester.sub) {
      throw new ForbiddenException('No tienes acceso a este perfil');
    }

    return patient;
  }

  async findByUserId(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: PATIENT_SELECT,
    });
    if (!patient) throw new NotFoundException('Perfil de paciente no encontrado');
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, requester: JwtPayload) {
    const patient = await this.prisma.patient.findUnique({ where: { id }, select: PATIENT_SELECT });
    if (!patient) throw new NotFoundException('Paciente no encontrado');

    if (requester.role !== Role.ADMIN && patient.user.id !== requester.sub) {
      throw new ForbiddenException('Solo puedes editar tu propio perfil');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.dateOfBirth) data['dateOfBirth'] = new Date(dto.dateOfBirth);

    return this.prisma.patient.update({ where: { id }, data, select: PATIENT_SELECT });
  }
}
