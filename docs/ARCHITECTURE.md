# Architecture — Prescriptions App

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     prescriptions-app (Monorepo)                     │
│                    pnpm workspaces + Turborepo 2                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
    ┌───────▼────────┐           ┌────────▼───────┐
    │   apps/api     │           │   apps/web     │
    │   NestJS 11    │◄──────────│  Next.js 15    │
    │   Port: 3001   │  REST API │  Port: 3000    │
    └───────┬────────┘           └────────────────┘
            │ Prisma 6
    ┌───────▼────────┐
    │  PostgreSQL 16 │
    │  Docker: 5433  │   ← host port 5433 maps to container 5432
    └────────────────┘
```

## Backend Layers (NestJS 11)

```
apps/api/src/
├── main.ts                    → Bootstrap: Helmet, CORS, Swagger, cookieParser, ValidationPipe global
├── config/                    → ConfigModule + Joi schema (env validation at startup)
├── prisma/                    → PrismaService (@Global singleton)
├── common/
│   ├── decorators/            → @Roles(...roles), @CurrentUser(), @Public()
│   ├── guards/                → JwtAuthGuard (global, APP_GUARD), RolesGuard (global, APP_GUARD)
│   ├── filters/               → HttpExceptionFilter → { message, code, details? }
│   └── dto/                   → PaginationDto (page, limit)
└── modules/
    ├── auth/                  → Login · Refresh rotation · Logout · /profile
    ├── users/                 → Admin CRUD (create with profile in transaction)
    ├── doctors/               → List · Get · GetMe · Update
    ├── patients/              → List · Get · GetMe · Update
    ├── prescriptions/         → Create · List (scoped by role) · Get · Consume · Delete · PDF
    ├── metrics/               → Admin summary · Doctor my-stats
    └── pdf/                   → PdfService: Buffer generation (pdfkit + qrcode)
```

## Auth Flow

```
Client                     API                       DB
  │                          │                        │
  ├─ POST /auth/login ───────►                        │
  │   { email, password }    ├─ find user ───────────►│
  │                          ◄─ user + hash ──────────┤
  │                          │  bcrypt.compare        │
  │                          │  sign accessJWT (15m)  │
  │                          │  sign refreshJWT (7d)  │
  │                          ├─ store hash(refresh),  │
  │                          │  family=UUID ─────────►│
  │◄─ { accessToken, user }  │                        │
  │   Set-Cookie: refresh_token (HTTP-Only)            │
  │   Set-Cookie: access_token (non-HTTP-Only, 14m)   │
  │                          │                        │
  ├─ GET /resource ──────────►                        │
  │   Bearer: accessToken    │  JwtAuthGuard verifies │
  │◄─ 200 response ──────────┤                        │
  │                          │                        │
  ├─ POST /auth/refresh ─────►                        │
  │   Cookie: refresh_token  │  verify JWT signature  │
  │                          ├─ find by hash ────────►│
  │                          │◄─ token record ────────┤
  │                          ├─ revoke old ──────────►│
  │                          ├─ create new (same fam) ►│
  │◄─ { accessToken }        │                        │
  │   Set-Cookie: refresh_token (rotated)              │
```

**Token storage strategy:**

- `refresh_token` → HTTP-Only cookie (inaccessible to JS, protected from XSS)
- `access_token` → non-HTTP-Only cookie (14 min expiry, readable by Next.js Edge middleware for route protection)

## Prescription Lifecycle

```
Doctor                       API                      Patient
  │                           │                         │
  ├─ POST /prescriptions ────►│                         │
  │   { patientId, items[] }  │  verify doctor profile  │
  │                           │  generate code PRESC-XXXXXXXX
  │                           │  Prisma tx:             │
  │                           │    create Prescription  │
  │                           │    create Items[]       │
  │◄─ 201 { prescription } ───┤                         │
  │                           │                         │
  │                           │◄── GET /prescriptions ──┤
  │                           │  (scoped: patient sees only own)
  │                           │◄── PATCH /:id/consume ──┤
  │                           │  verify ownership       │
  │                           │  status: pending → consumed
  │                           │  consumedAt = now()     │
  │                           ├─── 200 { consumed } ───►│
  │                           │                         │
  ├─ GET /:id/pdf ────────────►                         │
  │   Bearer: doctorToken     │  pdfkit → Buffer        │
  │◄─ application/pdf ────────┤  (A4, QR code, items table)
```

## Frontend Architecture (Next.js 15 App Router)

```
apps/web/src/
├── middleware.ts              → Edge: reads access_token cookie → redirect logic
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx    → Public: LoginForm with Suspense boundary
│   └── (dashboard)/
│       ├── layout.tsx         → AuthGate + Sidebar + Header
│       ├── prescriptions/     → List (filterable) · New (DOCTOR/ADMIN) · [id] (detail+PDF)
│       ├── patients/          → List (ADMIN/DOCTOR) · [id] (profile + prescriptions link)
│       ├── profile/           → Unified: PatientProfileForm | DoctorProfileForm | Admin info
│       ├── metrics/           → Role-aware: AdminDashboard | DoctorDashboard
│       └── users/             → List (ADMIN) · new/ (ADMIN create form)
├── components/
│   ├── auth/                  → AuthGate, RoleGuard, LoginForm
│   ├── layout/                → Sidebar (role-filtered nav), Header (logout)
│   ├── ui/                    → Button, Input, Badge, StatusBadge, Select,
│   │                            Pagination, EmptyState, Spinner
│   ├── prescriptions/         → PrescriptionCard, CreatePrescriptionForm
│   ├── patients/              → PatientProfileForm
│   ├── doctors/               → DoctorProfileForm
│   ├── metrics/               → StatCard, TopDoctorsList, DoctorStatsView
│   └── users/                 → UsersTable, CreateUserForm
├── services/                  → auth · prescriptions · patients · doctors · metrics · users
├── lib/
│   ├── api-client.ts          → fetch wrapper with auto-refresh on 401
│   └── utils.ts               → cn(), formatDate(), formatDateTime()
├── store/
│   └── auth.store.ts          → Zustand (user persisted, token in cookie only)
└── hooks/
    └── use-auth.ts            → isAdmin, isDoctor, isPatient, isAuthenticated
```

**Data flow pattern:**

- Page component (Client Component) → `useEffect` → `service.method()` → `apiClient.get/post/…`
- `apiClient` adds Bearer header, retries on 401 via silent refresh, redirects to `/login` if refresh fails
- Auth state: `useAuthStore` (Zustand, persists `user` only) + cookie `access_token` (token)

## Database Schema

```
User ────────────────────────────────────────────────────┐
  id, email, passwordHash, role (admin|doctor|patient)   │
  createdAt                                               │
  │                                                       │
  ├──────────────────┐                                   │
  ▼                  ▼                                   │
Doctor            Patient                                │
  userId (FK)       userId (FK)                           │
  firstName         firstName                             │
  lastName          lastName                              │
  speciality        dateOfBirth?                          │
  licenseNumber     phone?                                │
  │                  │                                   │
  │ authorId         │ patientId                          │
  └──────────────────┴──► Prescription                   │
                           id (UUID)                     │
                           code  PRESC-[8hex]            │
                           status  pending | consumed    │
                           notes?                        │
                           consumedAt?                   │
                           @@index([status, createdAt])  │
                           @@index([patientId])          │
                           @@index([authorId])           │
                           │                             │
                           └──► PrescriptionItem         │
                                medicationName           │
                                dosage?, frequency?      │
                                quantity?                │
                                                         │
RefreshToken ◄───────────────────────────────────────────┘
  userId (FK), tokenHash (SHA-256), family (UUID)
  expiresAt, revokedAt?, createdAt
```

## Security Model

| Threat              | Mitigation                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| XSS → token theft   | `refresh_token` en HTTP-Only cookie; `access_token` en cookie de vida corta (14m)              |
| CSRF                | `SameSite=Strict` en ambas cookies                                                             |
| Refresh token theft | Family revocation: reutilizar un token revocado invalida toda la familia de sesión             |
| Unauthorized access | `JwtAuthGuard` global — todo está protegido por defecto; `@Public()` es la excepción explícita |
| Over-fetching data  | Scope automático en `findAll`: doctor ve sus prescripciones, paciente las suyas, admin todas   |
| Rate abuse          | `ThrottlerGuard` global (configurable via env: TTL + límite)                                   |
| Injection           | `ValidationPipe` global con `whitelist: true`, `forbidNonWhitelisted: true`                    |
