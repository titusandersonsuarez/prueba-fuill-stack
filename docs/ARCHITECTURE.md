# Architecture — Prescriptions App

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         prescriptions-app (Monorepo)                 │
│                        pnpm workspaces + Turborepo                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
    ┌───────▼────────┐           ┌────────▼───────┐
    │   apps/api     │           │   apps/web     │
    │   NestJS 10    │◄──────────│  Next.js 15    │
    │   Port: 3001   │  REST API │  Port: 3000    │
    └───────┬────────┘           └────────────────┘
            │
    ┌───────▼────────┐
    │  PostgreSQL 16 │
    │  Port: 5432    │
    └────────────────┘
```

## Backend Layers (NestJS)

```
src/
├── main.ts                    → Bootstrap: Helmet, CORS, Swagger, Throttler, Validation
├── config/                    → ConfigModule + Joi env validation
├── prisma/                    → PrismaService (singleton)
├── common/
│   ├── decorators/            → @Roles(), @CurrentUser(), @Public()
│   ├── guards/                → JwtAuthGuard (global), RolesGuard (global)
│   ├── filters/               → HttpExceptionFilter → { message, code, details }
│   ├── interceptors/          → LoggingInterceptor, TransformInterceptor
│   ├── pipes/                 → ValidationPipe (global, whitelist, forbidNonWhitelisted)
│   └── dto/                   → PaginationDto, BaseFilterDto
└── modules/
    ├── auth/                  → JWT + Refresh rotation + Local strategy
    ├── users/                 → Admin CRUD
    ├── patients/              → Doctor + Admin read
    ├── doctors/               → Admin read
    ├── prescriptions/         → Core business logic
    └── admin/                 → Metrics + dashboard data
```

## Auth Flow

```
Client                API                  Database
  │                    │                       │
  ├──POST /auth/login──►                       │
  │                    ├──find user─────────── ►│
  │                    ◄──user found────────── ─┤
  │                    │ verify password        │
  │                    ├──create RefreshToken──►│
  │◄─{ accessToken,    │  (hashed, stored)     │
  │    refreshToken }──┤                       │
  │                    │                       │
  ├──GET /resource     │                       │
  │  Bearer: accessToken                       │
  │                    │ JwtAuthGuard verifies  │
  │◄──200 response─────┤                       │
  │                    │                       │
  ├──POST /auth/refresh│                       │
  │  { refreshToken }  │                       │
  │                    ├──find & verify hash── ►│
  │                    ├──revoke old token───── ►│
  │                    ├──create new token───── ►│
  │◄─{ accessToken,    │                       │
  │    refreshToken }──┤                       │
```

## Prescription Flow

```
Doctor                  API                  Patient
  │                      │                      │
  ├─POST /prescriptions──►                      │
  │  { patientId, items }│                      │
  │                      │ Generate RX-code     │
  │                      │ Transaction:         │
  │                      │  create Prescription │
  │                      │  create Items        │
  │◄─201 { prescription }┤                      │
  │                      │                      │
  │                      ◄──GET /me/prescriptions
  │                      │                      │
  │                      ├──filter by patientId─►
  │                      │◄─prescriptions list──┤
  │                      ├──────────────────────►│
  │                      │                 PUT /prescriptions/:id/consume
  │                      ◄──────────────────────┤
  │                      │ status → consumed     │
  │                      │ consumedAt = now()    │
  │                      ├──────────────────────►│
```

## Frontend Architecture (Next.js 15)

```
app/
├── (auth)/login/         → Public route
├── (doctor)/             → Protected: role=doctor
│   └── doctor/prescriptions/
├── (patient)/            → Protected: role=patient
│   └── patient/prescriptions/
└── (admin)/              → Protected: role=admin
    └── admin/

middleware.ts → Reads JWT from cookie → validates role → redirects
```

## Database Schema

```
User ──────────────────────────────────────────────┐
  │ id, email, password, role, createdAt            │
  │                                                  │
  ├──────────────────┐                              │
  ▼                  ▼                              │
Doctor            Patient                           │
  │ userId           │ userId                        │
  │ speciality       │ dateOfBirth                   │
  │ licenseNumber    │ phone                         │
  │                  │                              │
  │ authorId         │ patientId                     │
  └──────────────────┴──►Prescription               │
                          │ id, code (RX-*)          │
                          │ status (pending/consumed)│
                          │ notes, consumedAt        │
                          │ @@index([status, createdAt])
                          │ @@index([patientId])     │
                          │ @@index([authorId])      │
                          │                          │
                          └──►PrescriptionItem       │
                               medicationName, dosage│
                               frequency, quantity    │
                                                     │
RefreshToken◄────────────────────────────────────────┘
  userId, tokenHash, expiresAt, revokedAt, family
```
