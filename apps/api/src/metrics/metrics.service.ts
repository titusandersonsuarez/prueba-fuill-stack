import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 86_400_000);
    const last30 = new Date(now.getTime() - 30 * 86_400_000);

    const [
      totalAdmin,
      totalDoctors,
      totalPatients,
      totalPrescriptions,
      pending,
      consumed,
      last7Days,
      last30Days,
      topDoctorsRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'admin' } }),
      this.prisma.user.count({ where: { role: 'doctor' } }),
      this.prisma.user.count({ where: { role: 'patient' } }),
      this.prisma.prescription.count(),
      this.prisma.prescription.count({ where: { status: 'pending' } }),
      this.prisma.prescription.count({ where: { status: 'consumed' } }),
      this.prisma.prescription.count({ where: { createdAt: { gte: last7 } } }),
      this.prisma.prescription.count({ where: { createdAt: { gte: last30 } } }),
      this.prisma.prescription.groupBy({
        by: ['authorId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Enrich top doctors with names
    const authorIds = topDoctorsRaw.map((r) => r.authorId);
    const doctors = await this.prisma.doctor.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, firstName: true, lastName: true, speciality: true },
    });
    const doctorMap = new Map(doctors.map((d) => [d.id, d]));

    const topDoctors = topDoctorsRaw.map((r) => {
      const doc = doctorMap.get(r.authorId);
      return {
        doctorId: r.authorId,
        name: doc ? `${doc.firstName} ${doc.lastName}` : 'Desconocido',
        speciality: doc?.speciality ?? '',
        prescriptionCount: r._count.id,
      };
    });

    return {
      users: {
        total: totalAdmin + totalDoctors + totalPatients,
        admin: totalAdmin,
        doctors: totalDoctors,
        patients: totalPatients,
      },
      prescriptions: {
        total: totalPrescriptions,
        pending,
        consumed,
        consumptionRate:
          totalPrescriptions > 0 ? Math.round((consumed / totalPrescriptions) * 100) : 0,
      },
      activity: {
        last7Days,
        last30Days,
      },
      topDoctors,
    };
  }

  async getDoctorStats(doctorUserId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
    if (!doctor) return null;

    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 86_400_000);

    const [total, pending, consumed, last30Days] = await Promise.all([
      this.prisma.prescription.count({ where: { authorId: doctor.id } }),
      this.prisma.prescription.count({ where: { authorId: doctor.id, status: 'pending' } }),
      this.prisma.prescription.count({ where: { authorId: doctor.id, status: 'consumed' } }),
      this.prisma.prescription.count({
        where: { authorId: doctor.id, createdAt: { gte: last30 } },
      }),
    ]);

    return {
      doctor: { id: doctor.id, firstName: doctor.firstName, lastName: doctor.lastName },
      prescriptions: { total, pending, consumed, last30Days },
    };
  }
}
