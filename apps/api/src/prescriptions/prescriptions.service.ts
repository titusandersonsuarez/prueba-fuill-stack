import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { JwtPayload, PaginatedResponse, PrescriptionStatus, Role } from '@prescriptions/shared';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ListPrescriptionsDto } from './dto/list-prescriptions.dto';

const PRESCRIPTION_SELECT = {
  id: true,
  code: true,
  status: true,
  notes: true,
  consumedAt: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, firstName: true, lastName: true, speciality: true },
  },
  patient: {
    select: { id: true, firstName: true, lastName: true },
  },
  items: {
    select: {
      id: true,
      medicationName: true,
      dosage: true,
      frequency: true,
      quantity: true,
      instructions: true,
    },
  },
} as const;

const PDF_SELECT = {
  id: true,
  code: true,
  status: true,
  notes: true,
  consumedAt: true,
  createdAt: true,
  author: {
    select: {
      firstName: true,
      lastName: true,
      speciality: true,
      licenseNumber: true,
    },
  },
  patient: {
    select: { firstName: true, lastName: true, dateOfBirth: true },
  },
  items: {
    select: {
      medicationName: true,
      dosage: true,
      frequency: true,
      quantity: true,
      instructions: true,
    },
  },
} as const;

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private pdf: PdfService,
  ) {}

  async create(dto: CreatePrescriptionDto, requester: JwtPayload) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: requester.sub },
    });
    if (!doctor) throw new ForbiddenException('Solo los médicos pueden crear prescripciones');

    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('Paciente no encontrado');

    const code = this.generateCode();

    return this.prisma.prescription.create({
      data: {
        code,
        authorId: doctor.id,
        patientId: dto.patientId,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            medicationName: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            quantity: item.quantity,
            instructions: item.instructions,
          })),
        },
      },
      select: PRESCRIPTION_SELECT,
    });
  }

  async findAll(
    dto: ListPrescriptionsDto,
    requester: JwtPayload,
  ): Promise<PaginatedResponse<unknown>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = await this.buildWhereClause(dto, requester);

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        skip,
        take: limit,
        where,
        select: PRESCRIPTION_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, requester: JwtPayload) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      select: PRESCRIPTION_SELECT,
    });
    if (!prescription) throw new NotFoundException('Prescripción no encontrada');

    await this.assertCanAccess(prescription, requester);
    return prescription;
  }

  async consume(id: string, requester: JwtPayload) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      select: PRESCRIPTION_SELECT,
    });
    if (!prescription) throw new NotFoundException('Prescripción no encontrada');

    if (requester.role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId: requester.sub } });
      if (!patient || prescription.patient.id !== patient.id) {
        throw new ForbiddenException('No tienes acceso a esta prescripción');
      }
    }

    if (prescription.status !== PrescriptionStatus.PENDING) {
      throw new BadRequestException('La prescripción ya fue consumida');
    }

    return this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.CONSUMED,
        consumedAt: new Date(),
      },
      select: PRESCRIPTION_SELECT,
    });
  }

  async remove(id: string, requester: JwtPayload): Promise<void> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      select: { id: true, author: { select: { userId: true } } },
    });
    if (!prescription) throw new NotFoundException('Prescripción no encontrada');

    if (requester.role !== Role.ADMIN && prescription.author.userId !== requester.sub) {
      throw new ForbiddenException(
        'Solo el médico autor o un admin puede eliminar esta prescripción',
      );
    }

    await this.prisma.prescription.delete({ where: { id } });
  }

  private async buildWhereClause(dto: ListPrescriptionsDto, requester: JwtPayload) {
    const where: Record<string, unknown> = {};

    if (dto.status) where['status'] = dto.status;
    if (dto.code) where['code'] = { contains: dto.code, mode: 'insensitive' };

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (dto.from) {
      const fromDate = new Date(dto.from);
      fromDate.setHours(0, 0, 0, 0);
      createdAt.gte = fromDate;
    }
    if (dto.to) {
      const toDate = new Date(dto.to);
      toDate.setHours(23, 59, 59, 999);
      createdAt.lte = toDate;
    }
    if (createdAt.gte || createdAt.lte) where['createdAt'] = createdAt;

    if (requester.role === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: requester.sub } });
      if (!doctor) throw new ForbiddenException('Perfil de médico no encontrado');
      where['authorId'] = doctor.id;
      if (dto.patientId) where['patientId'] = dto.patientId;
    } else if (requester.role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId: requester.sub } });
      if (!patient) throw new ForbiddenException('Perfil de paciente no encontrado');
      where['patientId'] = patient.id;
    } else {
      // ADMIN: can filter freely
      if (dto.patientId) where['patientId'] = dto.patientId;
      if (dto.authorId) where['authorId'] = dto.authorId;
    }

    return where;
  }

  private async assertCanAccess(
    prescription: { author: { id: string }; patient: { id: string } },
    requester: JwtPayload,
  ): Promise<void> {
    if (requester.role === Role.ADMIN) return;

    if (requester.role === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: requester.sub } });
      if (!doctor || prescription.author.id !== doctor.id) {
        throw new ForbiddenException('No tienes acceso a esta prescripción');
      }
      return;
    }

    if (requester.role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId: requester.sub } });
      if (!patient || prescription.patient.id !== patient.id) {
        throw new ForbiddenException('No tienes acceso a esta prescripción');
      }
    }
  }

  async getPdf(id: string, requester: JwtPayload): Promise<Buffer> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      select: {
        ...PDF_SELECT,
        author: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            speciality: true,
            licenseNumber: true,
          },
        },
        patient: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
      },
    });
    if (!prescription) throw new NotFoundException('Prescripción no encontrada');

    await this.assertCanAccess(prescription, requester);

    return this.pdf.generatePrescriptionPdf(prescription);
  }

  private generateCode(): string {
    return `PRESC-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  }
}
