import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const ADMIN = { email: 'admin@test.com', password: 'admin123' };
const DOCTOR = { email: 'dr@test.com', password: 'doctor123' };
const PATIENT = { email: 'patient@test.com', password: 'patient123' };

describe('Prescriptions API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Auth', () => {
    it('POST /auth/login — 401 con credenciales incorrectas', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'wrongpass' })
        .expect(401);
    });

    it('POST /auth/login — 400 con body inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '123' })
        .expect(400);
    });

    it('POST /auth/login — 200 con credenciales válidas, devuelve accessToken', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send(ADMIN).expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'admin' });
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('GET /auth/profile — 401 sin token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('GET /auth/profile — 200 con token válido', async () => {
      const loginRes = await request(app.getHttpServer()).post('/auth/login').send(ADMIN);

      const { accessToken } = loginRes.body as { accessToken: string };
      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ email: ADMIN.email, role: 'admin' });
    });

    it('POST /auth/refresh — 401 sin cookie', () => {
      return request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });

    it('POST /auth/refresh — 200 rota el token y emite nueva cookie', async () => {
      const loginRes = await request(app.getHttpServer()).post('/auth/login').send(DOCTOR);

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c: string) => c.startsWith('refresh_token='));
      expect(refreshCookie).toBeDefined();

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshCookie!)
        .expect(200);

      expect(refreshRes.body).toHaveProperty('accessToken');
      const newCookies = refreshRes.headers['set-cookie'] as unknown as string[];
      expect(newCookies).toBeDefined();
    });

    it('POST /auth/logout — 204 y limpia la cookie', async () => {
      const loginRes = await request(app.getHttpServer()).post('/auth/login').send(PATIENT);

      const { accessToken } = loginRes.body as { accessToken: string };
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c: string) => c.startsWith('refresh_token='));

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshCookie!)
        .expect(204);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // PRESCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Prescriptions', () => {
    let doctorToken: string;
    let patientToken: string;
    let adminToken: string;
    let testPatientId: string;
    let createdPrescriptionId: string;

    beforeAll(async () => {
      const [adminRes, doctorRes, patientRes] = await Promise.all([
        request(app.getHttpServer()).post('/auth/login').send(ADMIN),
        request(app.getHttpServer()).post('/auth/login').send(DOCTOR),
        request(app.getHttpServer()).post('/auth/login').send(PATIENT),
      ]);

      adminToken = (adminRes.body as { accessToken: string }).accessToken;
      doctorToken = (doctorRes.body as { accessToken: string }).accessToken;
      patientToken = (patientRes.body as { accessToken: string }).accessToken;

      // Obtener un patientId válido de la DB
      const patientsRes = await request(app.getHttpServer())
        .get('/patients?limit=1')
        .set('Authorization', `Bearer ${doctorToken}`);

      const patientsBody = patientsRes.body as { data: { id: string }[] };
      testPatientId = patientsBody.data[0].id;
    });

    afterAll(async () => {
      if (createdPrescriptionId) {
        await request(app.getHttpServer())
          .delete(`/prescriptions/${createdPrescriptionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .catch(() => {
            // ya eliminada en el test, ignorar
          });
      }
    });

    it('POST /prescriptions — 403 si el usuario no es doctor', async () => {
      await request(app.getHttpServer())
        .post('/prescriptions')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patientId: testPatientId,
          items: [{ medicationName: 'Aspirina' }],
        })
        .expect(403);
    });

    it('POST /prescriptions — 201 doctor crea receta', async () => {
      const res = await request(app.getHttpServer())
        .post('/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: testPatientId,
          notes: 'Test E2E',
          items: [
            { medicationName: 'Amoxicilina', dosage: '500mg', frequency: 'Cada 8h', quantity: 21 },
            { medicationName: 'Ibuprofeno', dosage: '400mg', frequency: 'Cada 6h' },
          ],
        })
        .expect(201);

      const body = res.body as { id: string; code: string; status: string };
      expect(body).toHaveProperty('id');
      expect(body.code).toMatch(/^PRESC-[A-F0-9]{8}$/);
      expect(body.status).toBe('pending');
      createdPrescriptionId = body.id;
    });

    it('GET /prescriptions — doctor ve su receta recién creada', async () => {
      const res = await request(app.getHttpServer())
        .get('/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = res.body as { data: { id: string }[]; total: number };
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total');
      const found = body.data.find((p) => p.id === createdPrescriptionId);
      expect(found).toBeDefined();
    });

    it('GET /prescriptions/:id — 200 doctor obtiene detalle', async () => {
      const res = await request(app.getHttpServer())
        .get(`/prescriptions/${createdPrescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = res.body as { id: string; items: unknown[] };
      expect(body.id).toBe(createdPrescriptionId);
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('GET /prescriptions/:id — 403 si paciente intenta ver receta ajena', async () => {
      // Buscar una prescripción que no sea del paciente logueado
      const adminListRes = await request(app.getHttpServer())
        .get('/prescriptions')
        .set('Authorization', `Bearer ${adminToken}`);

      const adminBody = adminListRes.body as {
        data: { id: string; patient: { user: { email: string } } }[];
      };
      const ajenaPrescription = adminBody.data.find(
        (p) => p.patient?.user?.email !== PATIENT.email && p.id !== createdPrescriptionId,
      );

      if (ajenaPrescription) {
        await request(app.getHttpServer())
          .get(`/prescriptions/${ajenaPrescription.id}`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      }
    });

    it('GET /prescriptions/:id/pdf — 200 devuelve PDF', async () => {
      const res = await request(app.getHttpServer())
        .get(`/prescriptions/${createdPrescriptionId}/pdf`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      expect(res.body).toBeDefined();
    });

    it('PATCH /prescriptions/:id/consume — 403 si no es el paciente titular', async () => {
      const loginOther = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'patient2@test.com', password: 'patient123' });
      const otherToken = (loginOther.body as { accessToken: string }).accessToken;

      await request(app.getHttpServer())
        .patch(`/prescriptions/${createdPrescriptionId}/consume`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('PATCH /prescriptions/:id/consume — 200 paciente titular consume receta', async () => {
      // El paciente de la receta creada es testPatientId
      // Necesitamos el token del paciente cuyo Patient.id === testPatientId
      // Loguemos al patient@test.com y verificamos si es el dueño de testPatientId
      const res = await request(app.getHttpServer())
        .get(`/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const patientBody = res.body as { user: { email: string } };
      const ownerEmail = patientBody.user?.email;

      let ownerToken = patientToken;
      if (ownerEmail && ownerEmail !== PATIENT.email) {
        // Loguear al dueño real del patientId
        const ownerLoginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: ownerEmail, password: 'patient123' });
        ownerToken = (ownerLoginRes.body as { accessToken: string }).accessToken;
      }

      const consumeRes = await request(app.getHttpServer())
        .patch(`/prescriptions/${createdPrescriptionId}/consume`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const consumeBody = consumeRes.body as { status: string; consumedAt: string };
      expect(consumeBody.status).toBe('consumed');
      expect(consumeBody.consumedAt).toBeTruthy();
    });

    it('PATCH /prescriptions/:id/consume — 409 si ya fue consumida', async () => {
      // La misma receta ya está consumed
      await request(app.getHttpServer())
        .patch(`/prescriptions/${createdPrescriptionId}/consume`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });

    it('DELETE /prescriptions/:id — 204 admin elimina la receta', async () => {
      await request(app.getHttpServer())
        .delete(`/prescriptions/${createdPrescriptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      createdPrescriptionId = '';
    });

    it('GET /prescriptions/:id — 404 tras eliminarla', async () => {
      await request(app.getHttpServer())
        .get(`/prescriptions/${createdPrescriptionId || 'non-existent-id'}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // METRICS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Metrics', () => {
    let adminToken: string;
    let doctorToken: string;

    beforeAll(async () => {
      const [adminRes, doctorRes] = await Promise.all([
        request(app.getHttpServer()).post('/auth/login').send(ADMIN),
        request(app.getHttpServer()).post('/auth/login').send(DOCTOR),
      ]);
      adminToken = (adminRes.body as { accessToken: string }).accessToken;
      doctorToken = (doctorRes.body as { accessToken: string }).accessToken;
    });

    it('GET /metrics — 403 para no-admin', async () => {
      await request(app.getHttpServer())
        .get('/metrics')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });

    it('GET /metrics — 200 devuelve resumen para admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body).toHaveProperty('users');
      expect(body).toHaveProperty('prescriptions');
      expect(body).toHaveProperty('activity');
      expect(body).toHaveProperty('topDoctors');
      const users = body.users as Record<string, unknown>;
      expect(users).toHaveProperty('total');
      const prescriptions = body.prescriptions as Record<string, unknown>;
      expect(prescriptions).toHaveProperty('consumptionRate');
    });

    it('GET /metrics/my-stats — 200 devuelve stats del médico', async () => {
      const res = await request(app.getHttpServer())
        .get('/metrics/my-stats')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body).toHaveProperty('doctor');
      expect(body).toHaveProperty('prescriptions');
      const prescriptions = body.prescriptions as Record<string, unknown>;
      expect(prescriptions).toHaveProperty('total');
    });
  });
});
