import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload, PaginatedResponse, Role } from '@prescriptions/shared';
import { ListDoctorsDto } from './dto/list-doctors.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

const DOCTOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  speciality: true,
  licenseNumber: true,
  user: { select: { id: true, email: true, createdAt: true } },
} as const;

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: ListDoctorsDto): Promise<PaginatedResponse<unknown>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(dto);

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip,
        take: limit,
        where,
        select: DOCTOR_SELECT,
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private buildWhereClause(dto: ListDoctorsDto) {
    const where: Record<string, unknown> = {};

    if (dto.search) {
      const contains = { contains: dto.search, mode: 'insensitive' as const };
      where['OR'] = [
        { firstName: contains },
        { lastName: contains },
        { licenseNumber: contains },
        { user: { email: contains } },
      ];
    }

    if (dto.speciality) {
      where['speciality'] = { contains: dto.speciality, mode: 'insensitive' };
    }

    return where;
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id }, select: DOCTOR_SELECT });
    if (!doctor) throw new NotFoundException('Médico no encontrado');
    return doctor;
  }

  async findByUserId(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: DOCTOR_SELECT,
    });
    if (!doctor) throw new NotFoundException('Perfil de médico no encontrado');
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto, requester: JwtPayload) {
    const doctor = await this.findOne(id);

    if (requester.role !== Role.ADMIN && doctor.user.id !== requester.sub) {
      throw new ForbiddenException('Solo puedes editar tu propio perfil');
    }

    return this.prisma.doctor.update({
      where: { id },
      data: dto,
      select: DOCTOR_SELECT,
    });
  }
}
