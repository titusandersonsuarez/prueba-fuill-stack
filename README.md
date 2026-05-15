# Prescriptions App — Sistema de gestión de recetas médicas

Aplicación full-stack para la **emisión, consulta y consumo de recetas médicas**, con
control de acceso por rol (administrador / médico / paciente), generación de PDF con
código QR, panel de métricas y filtros de búsqueda en todos los listados.

Monorepo construido con **NestJS** (API REST) + **Next.js** (dashboard web), tipos
compartidos en un paquete interno, base de datos **PostgreSQL** vía **Prisma**, y todo
empaquetado en **Docker**.

---

## 🌐 Despliegue en producción

> Aplicación desplegada y funcionando. Credenciales de prueba más abajo.

| Servicio       | URL                                                    |
| -------------- | ------------------------------------------------------ |
| **Frontend**   | https://prueba-fuill-stack-production.up.railway.app   |
| **API REST**   | https://brave-smile-production-0b49.up.railway.app     |

Todo en **Docker sobre Railway** (3 servicios: PostgreSQL gestionado + `api` y
`web` construidos desde sus `Dockerfile`). La imagen de la API es
autosuficiente: aplica migraciones y siembra datos de demo en el primer
arranque. Guía paso a paso: **[`docs/DEPLOY.md`](docs/DEPLOY.md)**.

¿Sin acceso al despliegue? El proyecto corre completo en local con **un solo comando**
(ver [Revisión rápida](#-revisión-rápida-un-solo-comando)).

---

## ⚡ Revisión rápida (un solo comando)

> Pensado para que quien revise el proyecto **no tenga que configurar nada**.
> Requisito único: **Docker Desktop** instalado y corriendo.

```bash
git clone <repo-url>
cd prueba-fuill-stack
docker compose -f docker-compose.prod.yml up --build
```

Ese comando, sin pasos extra:

1. Construye las imágenes de API y Web.
2. Levanta PostgreSQL y espera a que esté sano.
3. Aplica las **migraciones** de Prisma automáticamente.
4. Carga los **datos de prueba** (usuarios + recetas de ejemplo).
5. Sirve API y Web.

No hace falta crear ningún `.env`: todos los secretos tienen un valor por defecto
seguro para entorno de demo (se pueden sobrescribir con variables de entorno para un
despliegue real).

Cuando termine (la primera build tarda unos minutos), abre:

| Servicio   | URL                       |
| ---------- | ------------------------- |
| **Web**    | http://localhost:3000     |
| API REST   | http://localhost:3001     |
| Swagger UI | http://localhost:3001/api |

Para parar y limpiar todo (incluida la base de datos):

```bash
docker compose -f docker-compose.prod.yml down -v
```

### Credenciales para entrar

| Email               | Contraseña   | Rol           | Qué puede ver / hacer                                                    |
| ------------------- | ------------ | ------------- | ------------------------------------------------------------------------ |
| `admin@test.com`    | `admin123`   | Administrador | Todo: usuarios, médicos, pacientes, todas las recetas, métricas globales |
| `dr@test.com`       | `doctor123`  | Médico        | Sus propias recetas, crear/eliminar recetas, sus métricas                |
| `dr2@test.com`      | `doctor123`  | Médico        | Ídem (segundo médico, para probar el aislamiento por rol)                |
| `patient@test.com`  | `patient123` | Paciente      | Solo sus recetas, marcarlas como consumidas, su perfil                   |
| `patient2@test.com` | `patient123` | Paciente      | Ídem                                                                     |
| `patient3@test.com` | `patient123` | Paciente      | Ídem                                                                     |

---

## Qué hace la aplicación

| Área              | Detalle                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Autenticación** | Login con JWT de acceso + **refresh token con rotación** y revocación por familia         |
| **Roles**         | `admin`, `doctor`, `patient` — cada endpoint y vista respeta el rol (RBAC con guards)     |
| **Recetas**       | Médico las crea (con varios medicamentos); paciente las consume; código único `PRESC-…`   |
| **PDF + QR**      | Descarga de la receta en PDF generado en memoria, con QR para verificación                |
| **Métricas**      | Dashboard de admin (totales, top médicos) y estadísticas individuales por médico          |
| **Filtros**       | Todos los listados (recetas, pacientes, médicos, usuarios) tienen búsqueda + paginación   |
| **Aislamiento**   | Un médico no ve recetas de otro; un paciente solo ve las suyas — verificado en el backend |

### Filtros disponibles por módulo

| Módulo    | Filtros (query params del API + UI con búsqueda _debounced_)           |
| --------- | ---------------------------------------------------------------------- |
| Recetas   | `status`, `code`, `patientId`, `authorId`, rango de fechas `from`/`to` |
| Pacientes | `search` (nombre, apellido o email)                                    |
| Médicos   | `search` (nombre, apellido, email, licencia) + `speciality`            |
| Usuarios  | `search` (email o nombre del perfil) + `role`                          |

---

## Stack

| Capa   | Tecnología                                                            |
| ------ | --------------------------------------------------------------------- |
| API    | NestJS 11 · Prisma 6 · PostgreSQL 16 · Passport JWT · class-validator |
| Web    | Next.js 15 (App Router) · React 19 · Tailwind CSS 3 · Zustand 5       |
| Shared | `packages/shared` — enums y tipos TypeScript compartidos              |
| Tests  | Jest 30 · ts-jest · React Testing Library 16                          |
| DevOps | pnpm 10 Workspaces · Turborepo 2 · Docker · GitHub Actions            |

---

## Desarrollo local (sin Docker para la app)

Para trabajar sobre el código con hot-reload. Aquí Docker solo se usa para la base de
datos.

**Requisitos:** Node.js ≥ 22 · pnpm ≥ 10 (`npm install -g pnpm`) · Docker.

```bash
# 1. Instalar dependencias
pnpm install

# 2. Variables de entorno (funciona tal cual para dev con la DB en el puerto 5433)
cp .env.example .env

# 3. Solo la base de datos (PostgreSQL + Adminer)
docker compose up -d

# 4. Migraciones + datos de prueba
pnpm --filter @prescriptions/api db:migrate
pnpm --filter @prescriptions/api db:seed

# 5. API + Web en watch mode, en paralelo
pnpm dev
```

| Servicio     | URL                       |
| ------------ | ------------------------- |
| Frontend     | http://localhost:3000     |
| API REST     | http://localhost:3001     |
| Swagger UI   | http://localhost:3001/api |
| Adminer (DB) | http://localhost:8080     |

> Los dos ficheros compose tienen propósitos distintos:
>
> - **`docker-compose.yml`** → solo PostgreSQL + Adminer (para `pnpm dev`).
> - **`docker-compose.prod.yml`** → stack completo (postgres + api + web), el de la revisión rápida.

---

## Comandos útiles

```bash
# Desarrollo
pnpm dev                                     # API + Web en watch mode

# Tests
pnpm --filter @prescriptions/api test        # Unit tests NestJS  (10)
pnpm --filter @prescriptions/web test        # Unit tests React   (47)
pnpm --filter @prescriptions/api test:e2e    # E2E (requiere DB con seed)

# Build
pnpm build                                   # shared → api → web

# Base de datos
pnpm --filter @prescriptions/api db:migrate  # Crear/aplicar migración (dev)
pnpm --filter @prescriptions/api db:seed     # Poblar con datos de prueba
pnpm --filter @prescriptions/api db:studio   # Prisma Studio (GUI de la DB)
```

---

## Calidad de código (husky)

El repo usa **husky + lint-staged**: antes de cada commit corre ESLint y Prettier
sobre los ficheros staged. Es opcional y **solo afecta a `git commit`** — quien solo
ejecuta o revisa el proyecto no lo necesita ni lo nota. Se instala solo con
`pnpm install` (script `prepare`).

---

## Variables de entorno

Para la revisión con Docker **no hace falta tocar nada** (todo tiene defaults en
`docker-compose.prod.yml`). Para desarrollo local copia `.env.example` → `.env`.
Variables que conviene definir en un despliegue real:

| Variable             | Descripción                         |
| -------------------- | ----------------------------------- |
| `DATABASE_URL`       | Connection string PostgreSQL        |
| `JWT_ACCESS_SECRET`  | Secreto JWT de acceso (≥ 32 chars)  |
| `JWT_REFRESH_SECRET` | Secreto JWT de refresh (≥ 32 chars) |
| `POSTGRES_PASSWORD`  | Contraseña de PostgreSQL            |

> `NEXT_PUBLIC_API_URL` se incrusta en el bundle del cliente en build time. Si la URL
> del API cambia entre entornos, hay que reconstruir la imagen web.

---

## Estructura del proyecto

```
prueba-fuill-stack/
├── apps/
│   ├── api/                  # NestJS API — puerto 3001
│   │   ├── src/
│   │   │   ├── auth/         # JWT + refresh token rotation (family revocation)
│   │   │   ├── users/        # CRUD usuarios (solo admin) + filtros
│   │   │   ├── doctors/      # Perfiles médicos + /me + filtros
│   │   │   ├── patients/     # Perfiles pacientes + /me + filtros
│   │   │   ├── prescriptions/# Core: crear · consumir · PDF · QR · filtros
│   │   │   ├── metrics/      # Dashboard admin + estadísticas médico
│   │   │   └── pdf/          # Generación PDF en memoria (pdfkit + qrcode)
│   │   └── prisma/           # Schema · migraciones · seed
│   └── web/                  # Next.js — puerto 3000
│       └── src/
│           ├── app/          # App Router: (auth) público · dashboard protegido
│           ├── components/   # UI atómica + componentes de dominio + layout
│           ├── services/     # Clientes REST tipados por módulo
│           ├── store/        # Zustand — auth (user persistido, token en cookie)
│           └── hooks/        # useAuth
├── packages/
│   └── shared/               # Role · PrescriptionStatus · PaginatedResponse · JwtPayload
├── docs/
│   ├── ARCHITECTURE.md       # Diagramas de sistema, flujos y esquema de BD
│   ├── DECISIONS.md          # ADRs: por qué se eligió cada tecnología
│   └── PROGRESS.md           # Log de progreso por fase
├── .github/workflows/ci.yml  # CI: lint + tests + build
├── docker-compose.yml        # Dev: solo PostgreSQL + Adminer
└── docker-compose.prod.yml   # Stack completo (revisión rápida)
```

---

## CI

`.github/workflows/ci.yml` corre en cada push/PR a `main`:

| Job     | Pasos                                      |
| ------- | ------------------------------------------ |
| `lint`  | TSC check (API + Web) · ESLint (API + Web) |
| `test`  | Unit tests API · Unit tests Web            |
| `build` | Build shared → API → Web                   |

`test` y `lint` corren en paralelo; `build` requiere que ambos pasen.

---

## Documentación adicional

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Diagramas de sistema, flujos y esquema de BD
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — ADRs: por qué se eligió cada tecnología
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — Log de las fases del proyecto
- **Swagger UI** en `http://localhost:3001/api` con el servidor corriendo
