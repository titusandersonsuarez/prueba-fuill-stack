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
      last30Rows,
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
      this.prisma.prescription.findMany({
        where: { createdAt: { gte: last30 } },
        select: { createdAt: true },
      }),
      this.prisma.prescription.groupBy({
        by: ['authorId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Serie diaria de los últimos 30 días (zero-filled para una línea continua).
    // La clave es la fecha en UTC (YYYY-MM-DD) para que el bucketing sea determinista.
    const counts = new Map<string, number>();
    for (const row of last30Rows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const byDay: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      byDay.push({ date: key, count: counts.get(key) ?? 0 });
    }

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
      byDay,
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
