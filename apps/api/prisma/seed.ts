import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const HASH_ROUNDS = 10;

  // Clear existing data
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // Admin
  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: await bcrypt.hash('admin123', HASH_ROUNDS),
      role: 'admin',
    },
  });

  // Doctors
  const drUser = await prisma.user.create({
    data: {
      email: 'dr@test.com',
      password: await bcrypt.hash('doctor123', HASH_ROUNDS),
      role: 'doctor',
    },
  });

  const dr2User = await prisma.user.create({
    data: {
      email: 'dr2@test.com',
      password: await bcrypt.hash('doctor123', HASH_ROUNDS),
      role: 'doctor',
    },
  });

  const doctor = await prisma.doctor.create({
    data: {
      userId: drUser.id,
      firstName: 'Carlos',
      lastName: 'Ramírez',
      speciality: 'Medicina General',
      licenseNumber: 'MED-001-2024',
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: dr2User.id,
      firstName: 'Ana',
      lastName: 'López',
      speciality: 'Cardiología',
      licenseNumber: 'MED-002-2024',
    },
  });

  // Patients
  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@test.com',
      password: await bcrypt.hash('patient123', HASH_ROUNDS),
      role: 'patient',
    },
  });

  const p2User = await prisma.user.create({
    data: {
      email: 'patient2@test.com',
      password: await bcrypt.hash('patient123', HASH_ROUNDS),
      role: 'patient',
    },
  });

  const p3User = await prisma.user.create({
    data: {
      email: 'patient3@test.com',
      password: await bcrypt.hash('patient123', HASH_ROUNDS),
      role: 'patient',
    },
  });

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      firstName: 'María',
      lastName: 'González',
      dateOfBirth: new Date('1990-04-15'),
      phone: '+34 612 345 678',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      userId: p2User.id,
      firstName: 'José',
      lastName: 'Martínez',
      dateOfBirth: new Date('1975-08-22'),
      phone: '+34 698 765 432',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      userId: p3User.id,
      firstName: 'Laura',
      lastName: 'Sánchez',
      dateOfBirth: new Date('2001-01-30'),
      phone: '+34 655 111 222',
    },
  });

  // Helper to generate prescription code
  const makeCode = (date: Date, suffix: string) => {
    const d = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `RX-${d}-${suffix}`;
  };

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  // Prescriptions
  const prescriptionsData = [
    {
      code: makeCode(daysAgo(20), 'A1B2C3'),
      authorId: doctor.id,
      patientId: patient.id,
      status: 'consumed' as const,
      consumedAt: daysAgo(18),
      createdAt: daysAgo(20),
      notes: 'Infección respiratoria leve',
      items: [
        { medicationName: 'Amoxicilina', dosage: '500mg', frequency: 'Cada 8h', quantity: 21 },
        { medicationName: 'Ibuprofeno', dosage: '400mg', frequency: 'Cada 6h', quantity: 12 },
      ],
    },
    {
      code: makeCode(daysAgo(15), 'D4E5F6'),
      authorId: doctor.id,
      patientId: patient.id,
      status: 'pending' as const,
      consumedAt: null,
      createdAt: daysAgo(15),
      notes: 'Control de hipertensión',
      items: [
        { medicationName: 'Enalapril', dosage: '10mg', frequency: 'Cada 24h', quantity: 30 },
        { medicationName: 'Atorvastatina', dosage: '20mg', frequency: 'Cada 24h', quantity: 30 },
        { medicationName: 'Aspirina', dosage: '100mg', frequency: 'Cada 24h', quantity: 30 },
      ],
    },
    {
      code: makeCode(daysAgo(10), 'G7H8I9'),
      authorId: doctor.id,
      patientId: patient2.id,
      status: 'consumed' as const,
      consumedAt: daysAgo(8),
      createdAt: daysAgo(10),
      notes: 'Dolor lumbar agudo',
      items: [
        { medicationName: 'Diclofenaco', dosage: '75mg', frequency: 'Cada 12h', quantity: 14 },
        {
          medicationName: 'Omeprazol',
          dosage: '20mg',
          frequency: 'Antes del desayuno',
          quantity: 14,
        },
      ],
    },
    {
      code: makeCode(daysAgo(8), 'J1K2L3'),
      authorId: doctor2.id,
      patientId: patient2.id,
      status: 'pending' as const,
      consumedAt: null,
      createdAt: daysAgo(8),
      notes: 'Revisión cardiológica',
      items: [
        { medicationName: 'Bisoprolol', dosage: '5mg', frequency: 'Cada 24h', quantity: 30 },
        { medicationName: 'Losartán', dosage: '50mg', frequency: 'Cada 24h', quantity: 30 },
      ],
    },
    {
      code: makeCode(daysAgo(6), 'M4N5O6'),
      authorId: doctor.id,
      patientId: patient3.id,
      status: 'pending' as const,
      consumedAt: null,
      createdAt: daysAgo(6),
      notes: 'Alergia estacional',
      items: [
        {
          medicationName: 'Loratadina',
          dosage: '10mg',
          frequency: 'Cada 24h',
          quantity: 10,
          instructions: 'Tomar por la mañana',
        },
        {
          medicationName: 'Fluticasona nasal',
          dosage: '50mcg',
          frequency: 'Cada 12h',
          quantity: 1,
          instructions: '2 pulsaciones por fosa nasal',
        },
      ],
    },
    {
      code: makeCode(daysAgo(4), 'P7Q8R9'),
      authorId: doctor2.id,
      patientId: patient.id,
      status: 'consumed' as const,
      consumedAt: daysAgo(2),
      createdAt: daysAgo(4),
      notes: 'Seguimiento post-operatorio',
      items: [
        {
          medicationName: 'Tramadol',
          dosage: '50mg',
          frequency: 'Cada 8h',
          quantity: 12,
          instructions: 'Solo si dolor intenso',
        },
        { medicationName: 'Paracetamol', dosage: '1g', frequency: 'Cada 6h', quantity: 20 },
        { medicationName: 'Metronidazol', dosage: '500mg', frequency: 'Cada 8h', quantity: 21 },
      ],
    },
    {
      code: makeCode(daysAgo(2), 'S1T2U3'),
      authorId: doctor.id,
      patientId: patient3.id,
      status: 'pending' as const,
      consumedAt: null,
      createdAt: daysAgo(2),
      notes: 'Gastritis',
      items: [
        { medicationName: 'Omeprazol', dosage: '40mg', frequency: 'Cada 24h', quantity: 28 },
        {
          medicationName: 'Sucralfato',
          dosage: '1g',
          frequency: 'Antes de las comidas',
          quantity: 30,
        },
      ],
    },
    {
      code: makeCode(daysAgo(1), 'V4W5X6'),
      authorId: doctor2.id,
      patientId: patient3.id,
      status: 'pending' as const,
      consumedAt: null,
      createdAt: daysAgo(1),
      notes: 'Infección urinaria',
      items: [
        {
          medicationName: 'Trimetoprima/Sulfametoxazol',
          dosage: '800/160mg',
          frequency: 'Cada 12h',
          quantity: 10,
        },
        {
          medicationName: 'Fosfomicina',
          dosage: '3g',
          frequency: 'Dosis única',
          quantity: 1,
          instructions: 'Disolver en agua',
        },
      ],
    },
  ];

  for (const pd of prescriptionsData) {
    const { items, ...prescriptionData } = pd;
    await prisma.prescription.create({
      data: {
        ...prescriptionData,
        items: { create: items },
      },
    });
  }

  console.log('Seed completed:');
  console.log('  Users: admin@test.com / admin123');
  console.log('         dr@test.com / doctor123');
  console.log('         dr2@test.com / doctor123');
  console.log('         patient@test.com / patient123');
  console.log('         patient2@test.com / patient123');
  console.log('         patient3@test.com / patient123');
  console.log(`  Prescriptions: ${prescriptionsData.length} created`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
