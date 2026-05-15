# Prescriptions App

Sistema de gestión de recetas médicas. Monorepo full-stack construido con NestJS + Next.js.

## Stack

| Capa   | Tecnología                                                      |
| ------ | --------------------------------------------------------------- |
| API    | NestJS 11 · Prisma 6 · PostgreSQL 16 · Passport JWT             |
| Web    | Next.js 15 (App Router) · React 19 · Tailwind CSS 3 · Zustand 5 |
| Shared | `packages/shared` — enums y tipos TypeScript compartidos        |
| Tests  | Jest 30 · ts-jest · React Testing Library 16                    |
| DevOps | pnpm 10 Workspaces · Turborepo 2 · Docker · GitHub Actions      |

## Requisitos previos

- Node.js ≥ 22
- pnpm ≥ 10 (`npm install -g pnpm`)
- Docker + Docker Compose (para PostgreSQL local)

## Setup local

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd prescriptions-app
pnpm install

# 2. Variables de entorno
cp .env.example .env
# El fichero funciona sin cambios para desarrollo con Docker en puerto 5433

# 3. Arrancar PostgreSQL
docker compose up -d postgres

# 4. Migraciones y datos de prueba
pnpm --filter @prescriptions/api db:migrate
pnpm --filter @prescriptions/api db:seed

# 5. Arrancar en modo desarrollo (API + Web en paralelo)
pnpm dev
```

## URLs en desarrollo

| Servicio     | URL                       |
| ------------ | ------------------------- |
| Frontend     | http://localhost:3000     |
| API REST     | http://localhost:3001     |
| Swagger UI   | http://localhost:3001/api |
| Adminer (DB) | http://localhost:8080     |

## Credenciales del seed

| Email             | Contraseña | Rol           |
| ----------------- | ---------- | ------------- |
| admin@test.com    | admin123   | Administrador |
| dr@test.com       | doctor123  | Médico        |
| dr2@test.com      | doctor123  | Médico        |
| patient@test.com  | patient123 | Paciente      |
| patient2@test.com | patient123 | Paciente      |
| patient3@test.com | patient123 | Paciente      |

## Comandos principales

```bash
# Desarrollo
pnpm dev                                     # API + Web en watch mode

# Tests
pnpm --filter @prescriptions/api test        # Unit tests NestJS
pnpm --filter @prescriptions/web test        # Unit tests React
pnpm --filter @prescriptions/api test:e2e    # E2E tests (requiere DB con seed)

# Build
pnpm build                                   # shared → api → web

# Base de datos
pnpm --filter @prescriptions/api db:migrate  # Crear/aplicar migración en dev
pnpm --filter @prescriptions/api db:seed     # Poblar con datos de prueba
pnpm --filter @prescriptions/api db:studio   # Abrir Prisma Studio
```

## Variables de entorno

Copia `.env.example` y ajusta los valores. Variables **requeridas en producción**:

| Variable             | Descripción                         |
| -------------------- | ----------------------------------- |
| `DATABASE_URL`       | Connection string PostgreSQL        |
| `JWT_ACCESS_SECRET`  | Secreto JWT de acceso (≥ 32 chars)  |
| `JWT_REFRESH_SECRET` | Secreto JWT de refresh (≥ 32 chars) |
| `POSTGRES_PASSWORD`  | Contraseña de PostgreSQL            |

## Docker — stack completo

```bash
# Copiar y completar variables de producción
cp .env.example .env.prod
# Editar .env.prod con secretos reales

# Construir imágenes
docker compose -f docker-compose.prod.yml --env-file .env.prod build

# Primera ejecución: aplicar migraciones
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api \
  sh -c "cd apps/api && node_modules/.bin/prisma migrate deploy"

# Arrancar todos los servicios
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

> **Nota:** `NEXT_PUBLIC_API_URL` se incrusta en el bundle del cliente en build time.
> Si la URL del API cambia entre entornos, hay que reconstruir la imagen web.

## Estructura del proyecto

```
prescriptions-app/
├── apps/
│   ├── api/                  # NestJS API — puerto 3001
│   │   ├── src/
│   │   │   ├── auth/         # JWT + refresh token rotation (family revocation)
│   │   │   ├── users/        # CRUD usuarios (solo admin)
│   │   │   ├── doctors/      # Perfiles médicos + /me
│   │   │   ├── patients/     # Perfiles pacientes + /me
│   │   │   ├── prescriptions/# Core: crear · consumir · PDF · QR
│   │   │   ├── metrics/      # Dashboard admin + estadísticas médico
│   │   │   └── pdf/          # Generación PDF en memoria (pdfkit + qrcode)
│   │   └── prisma/           # Schema · migraciones · seed
│   └── web/                  # Next.js — puerto 3000
│       └── src/
│           ├── app/
│           │   ├── (auth)/   # /login — rutas públicas
│           │   └── (dashboard)/ # /prescriptions · /patients · /metrics · /users · /profile
│           ├── components/   # UI atómica + componentes de dominio + layout
│           ├── services/     # Clientes REST tipados (auth, prescriptions, patients…)
│           ├── store/        # Zustand — auth state (user persistido, token en cookie)
│           └── hooks/        # useAuth
├── packages/
│   └── shared/               # Role · PrescriptionStatus · PaginatedResponse · JwtPayload
├── docs/
│   ├── ARCHITECTURE.md       # Diagramas y capas
│   ├── DECISIONS.md          # ADRs (Architecture Decision Records)
│   └── PROGRESS.md           # Log de progreso por fase
├── .github/workflows/ci.yml  # CI: lint + tests + build
├── .dockerignore
├── docker-compose.yml        # Desarrollo: solo PostgreSQL + Adminer
└── docker-compose.prod.yml   # Producción: postgres + api + web
```

## CI

El workflow `.github/workflows/ci.yml` corre en cada push/PR a `main`:

| Job     | Pasos                                      |
| ------- | ------------------------------------------ |
| `lint`  | TSC check (API + Web) · ESLint (API + Web) |
| `test`  | Unit tests API · Unit tests Web            |
| `build` | Build shared → API → Web                   |

Los jobs `test` y `lint` corren en paralelo; `build` requiere que ambos pasen.

## Documentación adicional

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Diagramas de sistema, flujos y esquema de BD
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — ADRs: por qué se eligió cada tecnología
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — Log de las 14 fases del proyecto
- Swagger UI disponible en `http://localhost:3001/api` cuando el servidor está corriendo
