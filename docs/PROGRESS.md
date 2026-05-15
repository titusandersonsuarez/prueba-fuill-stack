# Progress Log — Prescriptions App

## Phases

- [x] **FASE 0** — Bootstrap del Monorepo
- [x] **FASE 1** — Modelado de Datos y Prisma
- [x] **FASE 2** — Autenticación JWT + Refresh Token
- [x] **FASE 3** — Módulos de Usuarios, Pacientes y Médicos

---

## FASE 3 — Módulos de Usuarios, Pacientes y Médicos

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- `PaginationDto` en `src/common/dto/` (page, limit con validación)
- **UsersModule** (solo admin): `GET/POST /users`, `GET/PATCH/DELETE /users/:id`; crea perfil Doctor o Patient en la misma transacción Prisma según el rol; nunca devuelve el campo `password`
- **DoctorsModule**: `GET /doctors` (admin+doctor), `GET /doctors/:id` (cualquier autenticado), `PATCH /doctors/:id` (admin o médico propio)
- **PatientsModule**: `GET /patients` (admin+doctor), `GET /patients/:id` (con check de ownership para rol patient), `PATCH /patients/:id` (admin o paciente propio)
- Todos usan `PaginatedResponse<T>` de `@prescriptions/shared`
- AppModule actualizado con los tres módulos

### Decisiones tomadas

- **Ownership check en service**: el guard de roles verifica el rol, pero el check de "es tu propio recurso" se hace en el service (accede a la DB para confirmar `userId === requester.sub`) en lugar de un guard genérico, para evitar complejidad prematura
- **USER_SELECT / DOCTOR_SELECT / PATIENT_SELECT constantes**: el `select` de Prisma se define como `as const` en el tope del service para evitar repetición y garantizar que nunca se filtra por accidente el campo `password`

- [x] **FASE 4** — Módulo de Prescripciones (Core)

---

## FASE 4 — Módulo de Prescripciones (Core)

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- `CreatePrescriptionDto` + `CreatePrescriptionItemDto` con validación anidada (`@ValidateNested`, `@ArrayMinSize(1)`)
- `ListPrescriptionsDto` extiende `PaginationDto`, filtra por `status`, `patientId`, `authorId`
- **PrescriptionsService**:
  - `create`: verifica que el requester tenga perfil Doctor, genera código `PRESC-XXXXXXXX`, crea prescription con items en una sola operación Prisma
  - `findAll`: scope automático — doctor ve solo las suyas, paciente ve las suyas, admin ve todo; filtros adicionales según rol
  - `findOne`: con control de acceso por rol/ownership
  - `consume`: verifica ownership del paciente y que el estado sea `pending`, actualiza a `consumed` + `consumedAt`
  - `remove`: solo admin o el médico autor
- **PrescriptionsController**: `POST`, `GET`, `GET/:id`, `PATCH/:id/consume`, `DELETE/:id`
- AppModule actualizado

### Decisiones tomadas

- **Scope automático en `findAll`**: el filtro de acceso se construye en el service (`buildWhereClause`) basado en el rol del requester, no en el controller; evita que un doctor pueda ver prescripciones de otro pasando `authorId` en el query
- **Código `PRESC-XXXXXXXX`**: UUID parcial (8 hex chars) prefijado — suficientemente único para prescripciones en una clínica, legible para QR y PDF

- [x] **FASE 5** — PDF y Métricas

---

## FASE 5 — PDF y Métricas

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- `PdfService` en `src/pdf/`: genera PDF en memoria con pdfkit + QR con qrcode; layout A4 con header azul, info médico/paciente, tabla de items con filas alternas, badge de estado, footer con timestamp
- `GET /prescriptions/:id/pdf` — responde `application/pdf` con ownership check; la ruta `:id/pdf` está declarada ANTES de `:id` en el controlador para que NestJS no confunda "pdf" con un ID
- `MetricsService` + `MetricsController`:
  - `GET /metrics` (solo admin): totales por rol, prescripciones pending/consumed, tasa de consumo %, actividad últimos 7/30 días, top 5 médicos por volumen de prescripciones
  - `GET /metrics/my-stats` (solo doctor): sus propias métricas de prescripciones
- `esModuleInterop: true` añadido al tsconfig de la API (necesario para `import PDFDocument from 'pdfkit'`; de paso corregido `import cookieParser from 'cookie-parser'` en main.ts)

### Decisiones tomadas

- **pdfkit en memoria (Buffer)**: se evita escribir a disco — más simple, sin gestión de archivos temporales, sin riesgo de leaks en entorno serverless
- **QR code = código de prescripción**: en producción apuntaría a una URL de verificación; en desarrollo el código corto es suficiente para demostrar la funcionalidad
- **`groupBy` + enrich** en top doctors: Prisma groupBy no soporta include, así que se hace un segundo query con `findMany({ where: { id: { in: authorIds } } })` y se combina en memoria

- [x] **FASE 6** — Swagger + Tests E2E Backend

---

## FASE 6 — Swagger + Tests E2E Backend

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- **Swagger (OpenAPI)**: `DocumentBuilder` configurado con `addBearerAuth('access-token')` + `addCookieAuth('refresh_token')`; `SwaggerModule.setup('api', ...)` en `main.ts` con `persistAuthorization: true`
- **Decoradores Swagger** en todos los controllers: `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`, `@ApiCookieAuth`, `@ApiProduces`
- **`@ApiProperty` / `@ApiPropertyOptional`** en todos los DTOs (LoginDto, CreateUserDto, UpdateUserDto, UpdateDoctorDto, UpdatePatientDto, CreatePrescriptionDto, ListPrescriptionsDto, PaginationDto, AuthResponseDto)
- **`test/jest-e2e.json`** actualizado con `moduleNameMapper` + `globals.ts-jest.tsconfig`
- **Tests E2E** (`test/app.e2e-spec.ts`): 3 suites — Auth (7 tests), Prescriptions (9 tests), Metrics (3 tests); usan `beforeAll` para bootstrap único, cubren flujo completo login → crear receta → consume → delete + checks de roles/ownership
- **Fix unit tests**: `jest.spyOn(bcrypt)` falla en Jest 30 con propiedades no-configurables → reemplazado por `jest.mock('bcrypt', () => ({ ...jest.requireActual, compare: jest.fn() }))` + `jest.mocked()` en los tests

### Decisiones tomadas

- **`persistAuthorization: true`** en Swagger UI: evita re-ingresar el token en cada recarga durante desarrollo
- **E2E contra DB real**: los tests usan los datos del seed; crean una receta de prueba y la eliminan al final — más fiel que mocks, detecta regresiones de integración DB-Prisma

---

- [x] **FASE 7** — Bootstrap Frontend Next.js

---

## FASE 7 — Bootstrap Frontend Next.js

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- **`apps/web/package.json`**: Next.js 15, React 19, Tailwind CSS 3, Zustand 5, js-cookie, clsx, tailwind-merge
- **`tsconfig.json`**: extiende base, `moduleResolution: bundler`, paths `@/*` → `./src/*` y `@prescriptions/shared` → packages/shared; `transpilePackages` en `next.config.ts`
- **`src/lib/api-client.ts`**: cliente fetch tipado con `apiClient.get/post/patch/delete`; refresh automático en 401 con `tryRefresh()` (llama a `/auth/refresh` con cookie HTTP-only); access token en cookie `access_token` (14 min, SameSite=strict, no HTTP-only para que middleware pueda leerla)
- **`src/lib/utils.ts`**: `cn()` (clsx + tailwind-merge), `formatDate`, `formatDateTime`
- **`src/store/auth.store.ts`**: Zustand store `useAuthStore` con `persist` (solo `user`, no el token); `setAuth` setea cookie + store; `clearAuth` limpia ambos
- **`src/components/providers.tsx`**: limpia auth si hay `user` en store pero sin cookie (token expirado no refrescado)
- **`src/middleware.ts`**: protege rutas por presencia de cookie `access_token`; redirige `/` → `/dashboard`, sin token → `/login?from=...`
- **Estructura de rutas**: `(auth)/login/page.tsx`, `(auth)/layout.tsx` (centrado, gradiente), `(dashboard)/layout.tsx` (sidebar + header), `(dashboard)/page.tsx` → redirect a `/dashboard/prescriptions`
- **Componentes UI base**: `Button`, `Input`, `Badge`, `StatusBadge`
- **`Sidebar`**: navegación por rol (admin ve todo, doctor ve pacientes+recetas, paciente solo ve recetas); active state con clases Tailwind
- **`Header`**: botón logout que llama a `/auth/logout` y limpia store

### Decisiones tomadas

- **Access token en cookie no-HTTP-only**: necesario para que el middleware de Next.js (Edge runtime) pueda leer el token sin necesidad de decodificarlo server-side; el refresh token sigue siendo HTTP-only (manejo del backend)
- **`moduleResolution: bundler`**: recomendado por Next.js 15 — resuelve correctamente las importaciones ESM de react/next/etc

- [x] **FASE 8** — Autenticación Frontend

---

## FASE 8 — Autenticación Frontend

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- **`src/services/auth.service.ts`**: funciones tipadas `login`, `logout`, `profile` usando `apiClient`
- **`src/hooks/use-auth.ts`**: hook `useAuth()` que expone `user`, `isHydrated`, `isAuthenticated`, `isAdmin/isDoctor/isPatient`, `setAuth`, `clearAuth`
- **`src/components/auth/login-form.tsx`**: formulario completo con email+password, manejo de errores (`ApiError`), redirect a `?from=` param, loading state; envuelto en `<Suspense>` (requerido por `useSearchParams` en Next.js 15)
- **`src/components/auth/auth-gate.tsx`**: componente que espera hidratación del store, redirige a `/login` si no hay usuario
- **`src/components/auth/role-guard.tsx`**: guard por roles — redirige a `/dashboard/prescriptions` si el rol no está permitido
- **`src/components/providers.tsx`** actualizado: intenta refresh silencioso si hay `user` en store pero no cookie de access token (token expirado); setea el nuevo token en cookie y en store sin desloguear al usuario
- **`src/components/layout/header.tsx`** actualizado: usa `useAuth()`, muestra email + rol traducido, botón logout con icono
- **`src/components/ui/spinner.tsx`**: `Spinner` y `PageSpinner` para estados de carga
- **`(dashboard)/layout.tsx`** actualizado: envuelve el layout con `AuthGate`

### Decisiones tomadas

- **Refresh silencioso en `Providers`**: en vez de desloguear al usuario si la cookie expiró, intenta `POST /auth/refresh` (cookie HTTP-only va automáticamente); si el backend responde 200, actualiza la cookie sin interrumpir la sesión — mejora UX en sesiones largas
- **`Suspense` en `LoginForm`**: Next.js 15 requiere Suspense para `useSearchParams()` en Client Components que no son hojas; el fallback muestra un skeleton del formulario para evitar CLS

- [x] **FASE 9** — Frontend Médico
- [x] **FASE 10** — Frontend Paciente

---

## FASE 10 — Frontend Paciente

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

**Backend (extensión mínima):**

- `GET /patients/me` — endpoint nuevo en `PatientsController`, usa `findByUserId(user.sub)`; declarado ANTES de `GET /patients/:id` para evitar que "me" se interprete como un ID
- `GET /doctors/me` — ídem en `DoctorsController`

**Frontend:**

- `patientsService.getMe()` → `GET /patients/me`
- `doctorsService` — nuevo servicio: `list`, `getOne`, `getMe`, `update`
- `PatientProfileForm` — formulario editable: nombre, apellido, teléfono, fecha de nacimiento; llama `PATCH /patients/:id`
- `DoctorProfileForm` — formulario editable: nombre, apellido, especialidad; muestra número de colegiado (read-only)
- `/dashboard/profile` — página unificada para patient y doctor: carga el perfil según rol, muestra el formulario correspondiente; admin ve mensaje informativo
- Sidebar actualizado: "Mi perfil" visible para `PATIENT` y `DOCTOR`

### Decisiones tomadas

- **`/me` antes de `/:id`**: patrón obligatorio en NestJS — si `/:id` aparece primero, NestJS captura la string literal "me" como parámetro ID y la consulta falla en Prisma
- **Página unificada `/dashboard/profile`**: un solo componente detecta el rol y renderiza el formulario correspondiente — evita duplicar layouts y rutas

- [x] **FASE 11** — Frontend Admin (Dashboard + Métricas)
- [x] **FASE 12** — Testing Frontend Mínimo
- [x] **FASE 13** — DevOps: Docker, CI y Deploy
- [x] **FASE 14** — Documentación Final
- [x] **FASE 15** — Serie diaria de métricas + Gráficos + Toasts

---

## FASE 15 — Serie diaria de métricas + Gráficos + Toasts

**Fecha:** 2026-05-15
**Estado:** ✅ Completada

### Qué se hizo

**Backend:**

- `MetricsService.getSummary()` ahora devuelve `byDay`: serie de los **últimos 30 días**, _zero-filled_, con forma `{ date: 'YYYY-MM-DD', count }[]` (coincide con el contrato de la prueba). Se obtiene con un `findMany({ select: { createdAt } })` acotado a 30 días y bucketing en memoria por fecha UTC (determinista, sin SQL crudo)
- Test E2E de métricas extendido: verifica `byDay` array de longitud 30 con forma `{ date, count }`
- Descripción Swagger del endpoint `/metrics` actualizada

**Frontend:**

- Añadidas dependencias `recharts` y `sonner`
- `StatusChart` (donut recharts) — recetas pendientes vs consumidas con %
- `DailyChart` (área recharts) — serie de recetas por día (últimos 30), eje X con etiquetas DD/MM cada 5 días
- Dashboard admin: nueva sección de gráficos (estado + serie diaria) antes de Top médicos
- `<Toaster />` (sonner) montado en `Providers`; toasts conectados a: crear receta, consumir, eliminar (tabla + detalle) y errores de PDF — reemplazan los `alert()` nativos
- `MetricsSummary` (servicio web) ampliado con `byDay`

**Fixes de tests E2E preexistentes (detectados al ejecutar la suite completa con DB):**

- **Bug de contrato**: `consume` sobre una receta ya consumida lanzaba `BadRequestException` (400). El `@ApiResponse` del controller y la tabla de errores de la prueba especifican **409 Conflict** (conflicto de estado) → cambiado a `ConflictException`
- **Bug del test**: `GET /prescriptions` asertaba `body.total` plano, pero la API devuelve `{ data, meta: { total } }` (contrato `PaginatedResponse` usado en todo el proyecto) → corregido a `body.meta.total`
- Resultado: **E2E 22/22** (antes 20/22)

**README**: añadida sección _Despliegue en producción_ con tabla de URLs (Frontend/API/Swagger) y guía de despliegue (Railway API+DB, Vercel front) en comentario

### Decisiones tomadas

- **Bucketing en memoria vs SQL crudo**: 30 días de recetas es un volumen trivial; `findMany` + `Map` por fecha UTC es determinista, testeable y portable entre motores, sin riesgo de bugs de timezone de `date_trunc`
- **`byDay` añadido sin romper el contrato existente**: la respuesta de `/metrics` mantiene `users/prescriptions/activity/topDoctors` (de los que dependen E2E y el front) y solo **suma** `byDay` — cero regresiones
- **Toasts reemplazan `alert()`**: feedback no bloqueante y consistente (sonner `richColors`), requisito explícito de UX/UI de la prueba

---

## FASE 14 — Documentación Final

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

**`README.md`** — reescrito desde el stub inicial:

- Tabla de stack completa (NestJS 11 / Next.js 15 / Prisma / PostgreSQL / Zustand / Turborepo / Docker / GitHub Actions)
- Pasos de setup local: clone → install → `.env.example` → Docker Postgres → migrate → seed → `pnpm dev`
- Tabla de URLs de desarrollo (frontend, API, Swagger, Adminer)
- Credenciales del seed (admin, 2 médicos, 3 pacientes)
- Comandos principales: dev, test (API unit, web, E2E), build, db
- Variables de entorno requeridas en producción con descripción
- Instrucciones Docker completo (build + migrate + up)
- Árbol de estructura del proyecto con anotaciones por carpeta
- Descripción de los 3 jobs de CI y sus dependencias

**`docs/ARCHITECTURE.md`** — reescrito con información técnica correcta:

- Diagrama ASCII del sistema (monorepo → API (3001) + Web (3000) → PostgreSQL puerto 5433)
- Capas del backend NestJS 11 con árbol de directorios y responsabilidades
- Diagrama del flujo de auth completo (login → cookies dual: HTTP-only refresh + non-HTTP-only access)
- Ciclo de vida de una prescripción (Doctor POST → Patient consume → Doctor PDF)
- Arquitectura del frontend con árbol de rutas App Router y patrón de data flow
- Esquema de base de datos (User → Doctor/Patient → Prescription → PrescriptionItem + RefreshToken)
- Tabla del modelo de seguridad con amenazas y mitigaciones

**`docs/DECISIONS.md`** — reescrito con 13 ADRs, corrigiendo errores de ADRs anteriores:

- ADR-001 a ADR-009: revisados y corregidos (ej. ADR-006 eliminó referencia a TanStack Query que no se usa; ADR-007 corrigió la descripción de token storage: access token en cookie no-HTTP-only, no en localStorage/memory)
- ADR-010: Zustand 5 con persist (solo `user`, no token)
- ADR-011: Silent refresh en Providers (no interceptor de axios)
- ADR-012: Next.js Standalone Output para Docker
- ADR-013: Jest 30 + React Testing Library (no Vitest)

### Decisiones tomadas

- **ADRs como fuente de verdad**: cada decisión de diseño queda justificada con contexto, decisión y consecuencias (pros y trade-offs) — facilita que cualquier revisor entienda el "por qué" sin tener que inferirlo del código
- **ARCHITECTURE.md orientado a diagramas**: preferidos diagramas ASCII sobre prosa — más densos en información, más fáciles de actualizar inline, visibles sin herramientas externas

---

## FASE 13 — DevOps: Docker, CI y Deploy

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

**Fix prerequisito — packages/shared:**

- Actualizado `"main": "./dist/index.js"` en `packages/shared/package.json`
  — el tsconfig del API ya resolvía `@prescriptions/shared` a la fuente TypeScript en tiempo de compilación, pero el binario compilado (`node dist/main.js`) necesita JavaScript puro en runtime; el shared package ya tenía `tsconfig.json` + script `build` configurados, solo faltaba apuntar `main` al output

**apps/api/Dockerfile** — multi-stage:

- _Builder_: instala deps → compila `@prescriptions/shared` → genera Prisma client → `nest build`
- _Runner_: `node:22-alpine` mínimo; copia `node_modules` del builder (evita recompilar bcrypt nativo), `packages/shared/dist`, `apps/api/dist`, `apps/api/prisma`, `.prisma/client`; CMD: `node apps/api/dist/main.js`
- Nota en Dockerfile: cómo ejecutar migrations antes del primer arranque

**apps/web/Dockerfile** — Next.js standalone:

- Actualizado `next.config.ts`: añadido `output: 'standalone'` + `outputFileTracingRoot` (apunta a raíz del monorepo para que los deps del workspace queden incluidos en el bundle)
- _Builder_: `pnpm install` → `next build` con `NEXT_PUBLIC_API_URL` como build arg
- _Runner_: copia `.next/standalone`, `.next/static`, `public`; CMD: `node apps/web/server.js`

**docker-compose.prod.yml:**

- Servicios: `postgres` (16-alpine, healthcheck), `api` (con todas las env vars), `web` (con `NEXT_PUBLIC_API_URL` como build arg)
- Variables marcadas como requeridas con `:?` syntax (DATABASE_URL, JWT secrets)
- `NEXT_PUBLIC_API_URL` configurable desde `.env` — importante: se bake en el bundle del cliente en build time

**.dockerignore** — excluye `node_modules`, `dist`, `.next`, `.env*`, `.git`, `.turbo`, logs

**.github/workflows/ci.yml** — 3 jobs:

- `lint`: TypeScript check (API + Web) + ESLint (API + Web)
- `test`: API unit tests + Web tests (ambos con Prisma client generado)
- `build` (after lint + test): `@prescriptions/shared` → API → Web

### Decisiones tomadas

- **`main: ./dist/index.js` en shared**: único cambio necesario para que el runtime de Node.js cargue el módulo sin `ts-node`; tsconfig paths del API siguen apuntando a la fuente TypeScript para compilación, sin impacto en dev
- **Copiar `node_modules` del builder al runner (API)**: bcrypt usa bindings nativos de C++ compilados para Alpine; en vez de reinstalar en el runner (que requeriría `python3 make g++`), se copian desde el builder que ya los compiló en la misma plataforma — imagen ligeramente más grande pero sin dependencia de build tools en producción
- **`NEXT_PUBLIC_API_URL` como build arg**: las env vars `NEXT_PUBLIC_` se inkean en el bundle del browser en build time (no en runtime); para cambiar la URL del API hay que reconstruir la imagen web — esto es una limitación conocida de Next.js que se documenta explícitamente
- **Migrations fuera del CMD**: `prisma migrate deploy` requiere `prisma` CLI (devDep); se documenta como paso manual (`docker compose run --rm api sh -c "..."`) para mantener la imagen de producción sin herramientas de desarrollo

---

## FASE 12 — Testing Frontend Mínimo

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

**Infraestructura:**

- Instaladas dependencias: `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@types/jest`
- `jest.config.js` — usa `next/jest` (SWC transformer) + `testEnvironment: jsdom`; `moduleNameMapper` con `@prescriptions/shared` y `@/` explícito (fix para `jest.mock` con path aliases en Jest 30)
- `jest.setup.ts` — importa `@testing-library/jest-dom` para matchers extendidos
- Scripts `test` y `test:watch` en `package.json`

**Tests (47 tests, 6 suites, todos pasando):**

- `__tests__/lib/utils.test.ts` — `cn()` (merge, dedup Tailwind, falsy), `formatDate()`, `formatDateTime()` (nulos, Date objects, strings ISO)
- `__tests__/components/ui/button.test.tsx` — renderizado, disabled con `loading`, disabled con `disabled`, handler onClick, spinner SVG, variante danger, tamaño sm
- `__tests__/components/ui/badge.test.tsx` — todas las variantes (default, success, warning, danger, info), className forwarding; `StatusBadge` para PENDING y CONSUMED con texto y clases correctas
- `__tests__/store/auth.store.test.ts` — `setAuth` (estado + cookie), `clearAuth` (reset + cookie), `setHydrated`, `partialize` verificado via localStorage (accessToken NO persiste, user SÍ)
- `__tests__/hooks/use-auth.test.ts` — `isAuthenticated`, `isHydrated`, flags de rol (admin/doctor/patient), `clearAuth` reactivo
- `__tests__/components/auth/login-form.test.tsx` — renderizado de campos, error de ApiError, error genérico de red, redirect a /dashboard en éxito, botón deshabilitado durante loading

### Decisiones tomadas

- **`@/` explícito en moduleNameMapper**: `createJestConfig` de `next/jest` no resuelve el alias `@/` para `jest.mock()` en Jest 30 (funciona para imports pero no para mocks); añadir `'^@/(.*)$': '<rootDir>/src/$1'` explícitamente lo corrige sin conflicto
- **Mock de `@/store/auth.store` en login-form test**: más limpio que dejar que el store real llame a `setAccessToken`; el test se centra en el comportamiento del formulario (mensajes de error, redirect) sin efectos secundarios de cookies

---

## FASE 11 — Frontend Admin (Dashboard + Métricas)

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

**Servicios:**

- `src/services/metrics.service.ts`: `getSummary()` → `GET /metrics`, `getMyStats()` → `GET /metrics/my-stats`; interfaces tipadas `MetricsSummary` y `DoctorStats`
- `src/services/users.service.ts`: `list`, `getOne`, `create`, `remove`; interface `AdminUser` con relaciones doctor/patient anidadas

**Componentes métricas:**

- `src/components/metrics/stat-card.tsx` — tarjeta reutilizable con variantes de color (blue/green/yellow/red/slate)
- `src/components/metrics/top-doctors-list.tsx` — ranking top-5 con barra de progreso relativa al máximo
- `src/components/metrics/doctor-stats.tsx` — vista de estadísticas propias del médico con barra de tasa de consumo

**Componentes usuarios:**

- `src/components/users/users-table.tsx` — tabla paginada con badge de rol, nombre derivado (doctor/patient) y acción eliminar con confirmación
- `src/components/users/create-user-form.tsx` — formulario con campos condicionales por rol: doctor requiere especialidad + nº colegiado; paciente tiene fecha de nacimiento y teléfono opcionales

**Páginas:**

- `src/app/(dashboard)/metrics/page.tsx` — role-aware: admin ve `AdminDashboard` (4 secciones: usuarios, recetas, actividad, top médicos), doctor ve `DoctorDashboard` con sus propias métricas
- `src/app/(dashboard)/users/page.tsx` — listado de usuarios con RoleGuard admin y botón "Nuevo usuario"
- `src/app/(dashboard)/users/new/page.tsx` — formulario de creación con RoleGuard admin

**Sidebar actualizado:** "Métricas" visible para admin; "Usuarios" visible solo para admin

**Fix E2E:** Corregidas las aserciones del test de métricas (keys planas incorrectas `totalUsers`, `totalPrescriptions`, `consumptionRate` → estructura anidada real `users.total`, `prescriptions.consumptionRate`, etc.)

### Decisiones tomadas

- **Role-aware en metrics page**: en vez de dos páginas separadas (`/metrics/admin` y `/metrics/doctor`), una sola página `/metrics` detecta el rol y renderiza el componente apropiado — evita duplicar rutas y simplifica la navegación
- **Campos condicionales en create-user-form**: admin, doctor y patient tienen perfiles diferentes; renderizar solo los campos relevantes al rol seleccionado evita datos vacíos y reduce errores de validación del backend

---

## FASE 0 — Bootstrap del Monorepo

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- Inicializado monorepo con pnpm workspaces + Turborepo 2.x
- Creada estructura de carpetas: `apps/api`, `apps/web`, `packages/shared`, `docs/`
- Configurado TypeScript estricto en `tsconfig.base.json` (strict, noImplicitAny, etc.)
- Configurado ESLint (flat config) con reglas TypeScript estrictas (no-explicit-any como error)
- Configurado Prettier con estilo consistente (single quotes, trailing commas, LF)
- Configurado Husky + lint-staged para pre-commit hooks
- Creado `docker-compose.yml` con Postgres 16 + Adminer
- Creado `.env.example` con todas las variables necesarias
- Creado `packages/shared/src/types.ts` con tipos compartidos (Role, PrescriptionStatus, etc.)
- Creada documentación inicial (ARCHITECTURE.md, DECISIONS.md)

### Decisiones tomadas

- **Flat config de ESLint (v9)**: el nuevo formato es la dirección del proyecto, evita deprecation warnings
- **pnpm 10.x**: mejor performance que npm/yarn, workspaces nativos sin plugins adicionales
- **Tipos en packages/shared**: centraliza enums (Role, PrescriptionStatus) para evitar duplicación entre api y web

### Deuda técnica

- Husky configurado pero los hooks concretos se añadirán cuando haya código que lintear

---

## FASE 1 — Modelado de Datos y Prisma

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- Scaffoldeado `apps/api` con NestJS CLI + limpieza de boilerplate (README, app.controller, app.service)
- Instaladas todas las dependencias del backend: `@nestjs/*`, `prisma`, `bcrypt`, `pdfkit`, `qrcode`, `passport-jwt`, `helmet`, `joi`, etc.
- Corregido conflicto de puerto: PostgreSQL local en 5432 → Docker mapeado a puerto **5433**
- Creado `prisma/schema.prisma` con: `User`, `Doctor`, `Patient`, `Prescription`, `PrescriptionItem`, `RefreshToken`, enums `Role` y `PrescriptionStatus`
- Índices justificados: `@@index([status, createdAt])`, `@@index([patientId])`, `@@index([authorId])`
- Migración inicial aplicada: `20260514224940_init`
- Seed exitoso con: 1 admin, 2 médicos, 3 pacientes, 8 prescripciones (mix pending/consumed, 2-3 items c/u)
- `PrismaService` + `PrismaModule` (@Global) creados en `src/prisma/`
- `AppModule` configurado con `ConfigModule` + validación Joi de env vars
- `main.ts` configurado con helmet, cookieParser, CORS, ValidationPipe global

### Decisiones tomadas

- **Puerto 5433 para Docker**: había PostgreSQL local en 5432 (conflicto). Documentado en `.env.example`.
- **`prisma.config.ts`**: Prisma 6 requiere este archivo para cargar env vars correctamente (el método `.env` legacy no funciona sin él en v6).
- **PrismaModule @Global**: evita importarlo en cada feature module; PrismaService disponible en toda la app.

### Deuda técnica

- `prisma.config.ts` usa `earlyAccess: true` (Prisma 6 feature); monitorear cuando salga stable

---

## FASE 2 — Autenticación JWT + Refresh Token

**Fecha:** 2026-05-14
**Estado:** ✅ Completada

### Qué se hizo

- Decoradores: `@Public()`, `@Roles(...roles)`, `@CurrentUser()`
- Guards globales: `JwtAuthGuard` (extiende AuthGuard('jwt'), respeta @Public), `RolesGuard` (lanza 403 si el rol no coincide), `ThrottlerGuard`
- Filtro global: `HttpExceptionFilter` — responde `{ message, code, details? }` en todos los errores
- Estrategia JWT (`passport-jwt`): verifica Bearer token, valida que el usuario exista en DB
- `AuthService`:
  - `login`: valida credenciales, emite access + refresh JWT, guarda hash SHA-256 del refresh en `RefreshToken` con `family` (UUID)
  - `refresh`: verifica JWT con `JWT_REFRESH_SECRET`, compara hash, rota el token (revoca actual, crea nuevo en misma familia), detecta reuse revocando toda la familia
  - `logout`: revoca familia o todas las sesiones del usuario si el token es inválido
  - `hashPassword`: bcrypt con cost 10
- `AuthController`: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/profile`
- Refresh token en HTTP-Only cookie (`sameSite: strict`, `secure` en producción)
- `AppModule` actualizado: `ThrottlerModule.forRootAsync`, guards y filtro como providers globales con `APP_GUARD` / `APP_FILTER`
- Tests unitarios: 10 tests, todos pasando — cubre login válido/inválido, refresh con rotation, reuse detection, logout, hashPassword

### Decisiones tomadas

- **`jwt.sign()` con `expiresIn` como número**: `@nestjs/jwt` v11 usa `StringValue` (tipo branded de `ms`) — se convierte el string de config a segundos para evitar problemas de tipos con TS strict
- **Refresh en service sin Passport strategy para refresh**: el endpoint `POST /auth/refresh` está marcado `@Public()` y el servicio llama a `jwtService.verify()` directamente, evitando la complejidad de pasar el raw token a través de un guard de Passport
- **SHA-256 para hash de refresh tokens**: más rápido que bcrypt para tokens de alta entropía (el token ya es aleatorio, no necesita salt KDF)
- **`jest.restoreAllMocks()` en beforeEach**: necesario porque `jest.spyOn(bcrypt)` no se restaura solo con `clearAllMocks()`; sin esto los tests posteriores que usan bcrypt real fallan
