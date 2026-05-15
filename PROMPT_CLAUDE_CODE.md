# Prompt para Claude Code — Prueba Técnica Full-Stack Senior

## 🎯 Sistema de Prescripciones Médicas (NestJS + Next.js)

> **Cómo usar este documento:** copia este archivo completo y pégalo como primer mensaje a Claude Code en una sesión nueva dentro de la carpeta del proyecto. Claude Code ejecutará las fases de forma secuencial, documentando cada paso.

---

## 📌 CONTEXTO Y ROL

Actúa como **Full-Stack Senior Engineer** con +6 años de experiencia en arquitecturas escalables, DDD ligero, DevOps y testing. Estás resolviendo una **prueba técnica** que será evaluada por un equipo senior.

**Prioridades absolutas (en este orden):**

1. **Funcionalidad completa** (35% del puntaje) — todos los flujos por rol deben funcionar end-to-end.
2. **Calidad de código** (25%) — TypeScript estricto, DTOs validados, manejo de errores tipado, sin `any`.
3. **Arquitectura** (20%) — separación por capas, módulos cohesivos, Prisma bien usado, índices justificados.
4. **UX/UI** (15%) — responsive, estados loading/error/empty, toasts, accesibilidad básica.
5. **Testing** (5%) — cubrir lo crítico (auth, prescripciones, consume).

**Reglas de oro:**

- ❌ No uses `any`. ❌ No comentes código obvio. ❌ No agregues abstracciones especulativas.
- ✅ Documenta **decisiones técnicas** (el "porqué"), no el "qué".
- ✅ Cada fase debe terminar con commit semántico (`feat:`, `chore:`, `docs:`, `test:`).
- ✅ Al finalizar cada fase, actualiza `docs/PROGRESS.md` con: qué se hizo, decisiones tomadas, deuda técnica si aplica.

---

## 🧱 STACK OBLIGATORIO

| Capa          | Tecnología                             | Versión    |
| ------------- | -------------------------------------- | ---------- |
| Backend       | NestJS                                 | 10+        |
| ORM           | Prisma                                 | 5+         |
| DB            | PostgreSQL                             | 16         |
| Auth          | JWT (jsonwebtoken) + Passport          | latest     |
| Validación    | class-validator + class-transformer    | latest     |
| Docs API      | Swagger (@nestjs/swagger)              | latest     |
| Seguridad     | helmet, @nestjs/throttler, cors        | latest     |
| Tests BE      | Jest + Supertest                       | latest     |
| PDF           | pdfkit (o puppeteer si tiempo permite) | latest     |
| QR            | qrcode                                 | latest     |
| Frontend      | Next.js (App Router)                   | 15         |
| UI            | TailwindCSS + shadcn/ui                | 4 / latest |
| Data fetching | TanStack Query (React Query)           | 5          |
| State         | Zustand (auth)                         | latest     |
| Forms         | react-hook-form + zod                  | latest     |
| Charts        | Recharts                               | latest     |
| Toasts        | sonner                                 | latest     |
| Tests FE      | Vitest + @testing-library/react        | latest     |
| Monorepo      | pnpm workspaces + Turborepo            | latest     |
| Containers    | Docker + docker-compose (local dev)    | -          |

---

## 🏛️ ARQUITECTURA OBJETIVO

```
prescriptions-app/                  # Monorepo (pnpm + turborepo)
├── apps/
│   ├── api/                        # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # Login, register, refresh, guards, strategies
│   │   │   │   ├── users/          # CRUD usuarios (admin)
│   │   │   │   ├── patients/       # Perfil paciente + listados
│   │   │   │   ├── doctors/        # Perfil médico + listados
│   │   │   │   ├── prescriptions/  # Core: CRUD, consume, PDF
│   │   │   │   └── admin/          # Métricas, dashboard data
│   │   │   ├── common/
│   │   │   │   ├── decorators/     # @Roles, @CurrentUser, @Public
│   │   │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   │   │   ├── filters/        # HttpExceptionFilter (formato { message, code, details })
│   │   │   │   ├── interceptors/   # LoggingInterceptor, TransformInterceptor
│   │   │   │   ├── pipes/          # ValidationPipe global
│   │   │   │   └── dto/            # PaginationDto, BaseFilterDto
│   │   │   ├── prisma/             # PrismaService + module
│   │   │   ├── config/             # ConfigModule + env validation (joi)
│   │   │   └── main.ts             # Bootstrap: helmet, cors, swagger, throttler
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── test/                   # E2E tests
│   │
│   └── web/                        # Next.js frontend
│       ├── src/
│       │   ├── app/                # App Router
│       │   │   ├── (auth)/login/
│       │   │   ├── (doctor)/doctor/prescriptions/
│       │   │   ├── (patient)/patient/prescriptions/
│       │   │   ├── (admin)/admin/
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   │   ├── ui/             # shadcn primitives
│       │   │   ├── prescriptions/  # PrescriptionCard, ItemForm, StatusBadge
│       │   │   ├── charts/         # MetricsChart, ByDayChart
│       │   │   └── layout/         # AppShell, Sidebar, Topbar
│       │   ├── lib/
│       │   │   ├── api/            # Axios instance + interceptor refresh
│       │   │   ├── auth/           # Token storage, JWT decode
│       │   │   └── utils/          # cn, formatDate, etc.
│       │   ├── hooks/              # useAuth, usePrescriptions, useMetrics
│       │   ├── store/              # Zustand auth store
│       │   └── middleware.ts       # Route protection por rol
│       └── tests/
│
├── packages/
│   └── shared/                     # Tipos compartidos (Role, Status, DTOs)
│       └── src/types.ts
│
├── docs/
│   ├── ARCHITECTURE.md             # Diagrama y decisiones de arquitectura
│   ├── DECISIONS.md                # ADRs (Architecture Decision Records)
│   ├── PROGRESS.md                 # Log de avance por fase
│   ├── API.md                      # Resumen de endpoints (complemento a Swagger)
│   └── CONTEXT.md                  # Generado al final: contexto completo del proyecto
│
├── docker-compose.yml              # Postgres + adminer local
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
├── README.md                       # Setup, deploy, credenciales, scripts
└── LICENSE
```

**Decisiones arquitectónicas clave a documentar en `docs/DECISIONS.md`:**

1. **Monorepo con pnpm + Turborepo**: build caching, comandos unificados, deploy independiente.
2. **Modular monolith en NestJS**: cada feature en su módulo (auth, prescriptions, etc.), facilita migrar a microservicios si crece.
3. **Refresh token rotation con familia**: refresh tokens hasheados en DB, rotación al usar, revocación por familia ante sospecha.
4. **RBAC con Guards + Decorators**: `@Roles('doctor')` + `RolesGuard` global; el rol viaja en el JWT payload.
5. **PDF con pdfkit (no puppeteer)**: menor footprint, sin Chromium en producción, suficiente para el caso.
6. **TanStack Query en frontend**: caching automático, refetch en focus, invalidación granular tras mutaciones.
7. **Cookies HTTP-Only para refresh, Bearer para access**: previene XSS en refresh, simplifica logout server-side.
8. **Índices compuestos justificados**: `(status, createdAt)` para listados filtrados, `(patientId)` y `(authorId)` para lookups por rol.

---

## 🗓️ PLAN DE EJECUCIÓN POR FASES

Cada fase debe terminar con: ✅ código funcionando · ✅ commit · ✅ entrada en `docs/PROGRESS.md`.

---

### **FASE 0 — Bootstrap del Monorepo** ⏱️ ~30 min

**Objetivos:**

- Inicializar monorepo pnpm + Turborepo.
- Crear estructura de carpetas `apps/api`, `apps/web`, `packages/shared`, `docs/`.
- Configurar TypeScript estricto, ESLint, Prettier, Husky + lint-staged.
- Crear `docker-compose.yml` con Postgres 16 + Adminer.
- Crear `.env.example` con todas las variables necesarias.
- Inicializar git con `.gitignore` apropiado.
- Crear `docs/ARCHITECTURE.md` con diagrama ASCII de la arquitectura.

**Entregables:**

- `pnpm install` corre sin errores.
- `docker compose up -d` levanta Postgres + Adminer.
- `pnpm lint` y `pnpm format` operativos.
- Commit: `chore: bootstrap monorepo with pnpm + turborepo`.

---

### **FASE 1 — Modelado de Datos y Prisma** ⏱️ ~45 min

**Objetivos:**

- Crear `apps/api` con NestJS CLI.
- Instalar Prisma e inicializar.
- Implementar `schema.prisma` siguiendo el modelo de la prueba (User, Doctor, Patient, Prescription, PrescriptionItem, enums Role y PrescriptionStatus).
- Agregar índices: `@@index([status, createdAt])`, `@@index([patientId])`, `@@index([authorId])` en `Prescription`.
- Crear migración inicial: `prisma migrate dev --name init`.
- Implementar `prisma/seed.ts` con:
  - 1 admin (`admin@test.com` / `admin123`)
  - 1 médico (`dr@test.com` / `doctor123`)
  - 1 paciente (`patient@test.com` / `patient123`)
  - 2-3 pacientes adicionales
  - 8-10 prescripciones (mix pending/consumed, con 2-4 items cada una)
- Documentar índices y relaciones en `docs/DECISIONS.md`.

**Entregables:**

- `pnpm --filter api db:migrate` aplica migraciones.
- `pnpm --filter api db:seed` carga datos.
- Verificación en Adminer.
- Commit: `feat(api): prisma schema, migrations and seed`.

---

### **FASE 2 — Autenticación JWT + Refresh Token** ⏱️ ~90 min

**Objetivos:**

- Módulo `auth` con: `AuthService`, `AuthController`, `JwtStrategy`, `RefreshStrategy`, `LocalStrategy`.
- Hash de password con `bcrypt` (cost 10).
- Endpoints:
  - `POST /auth/login` → `{ accessToken, refreshToken, user }`
  - `POST /auth/refresh` → rota refresh (familia), devuelve `{ accessToken, refreshToken }`
  - `POST /auth/logout` → revoca refresh token actual
  - `GET /auth/profile` → usuario y rol (requiere access token)
- Almacenar refresh tokens **hasheados** en tabla `RefreshToken` (migración nueva).
- Configurar `ConfigModule` con validación de envs (Joi).
- `JwtAuthGuard` global (con `@Public()` decorator para excepciones).
- `RolesGuard` global + `@Roles()` decorator.
- `@CurrentUser()` decorator para extraer user del request.
- `HttpExceptionFilter` global con formato `{ message, code, details? }`.
- DTOs con `class-validator`: `LoginDto`, `RefreshDto`.
- Habilitar Helmet, CORS, Throttler (10 req/min en `/auth/*`).
- Tests unitarios: `AuthService` (login válido, login inválido, refresh rotación, refresh revocado).

**Entregables:**

- Probar login con seed admin → recibir tokens.
- Probar acceso a `/auth/profile` con Bearer.
- Probar refresh + revocación.
- Commit: `feat(api): jwt auth with refresh token rotation and rbac guards`.

---

### **FASE 3 — Módulos de Usuarios, Pacientes y Médicos** ⏱️ ~60 min

**Objetivos:**

- Módulo `users` (admin-only):
  - `GET /users?role=&query=&page=&limit=` con paginación + búsqueda por nombre/email.
  - `POST /users` crea usuario con rol (opcional, mejora puntaje).
- Módulo `patients`:
  - `GET /patients?query=&page=&limit=` (doctor + admin).
  - `GET /patients/:id` (doctor + admin).
- Módulo `doctors`:
  - `GET /doctors?query=&page=&limit=` (admin).
- `BaseFilterDto` reutilizable con paginación (page, limit, order).
- Respuesta paginada estandarizada: `{ data, meta: { total, page, limit, totalPages } }`.

**Entregables:**

- Endpoints probados con Postman/Insomnia.
- Commit: `feat(api): users, patients and doctors modules with pagination`.

---

### **FASE 4 — Módulo de Prescripciones (Core)** ⏱️ ~120 min

**Objetivos:**

- Módulo `prescriptions` con `PrescriptionsService`, `PrescriptionsController`.
- Generación de `code` único (formato: `RX-{YYYYMMDD}-{6chars}`).
- DTOs: `CreatePrescriptionDto`, `UpdatePrescriptionDto`, `PrescriptionFilterDto`.
- Endpoints:
  - **Médico:**
    - `POST /prescriptions` — crea con items (transacción Prisma).
    - `GET /prescriptions?mine=true&status=&from=&to=&page=&limit=&order=` — sólo las del médico autenticado.
    - `GET /prescriptions/:id` — verifica que el médico sea el autor.
  - **Paciente:**
    - `GET /me/prescriptions?status=&from=&to=&page=&limit=` — sólo las propias.
    - `GET /me/prescriptions/:id` — sólo si pertenece al paciente.
    - `PUT /prescriptions/:id/consume` — marca como `consumed` + `consumedAt = now()`. Idempotente: si ya está consumed, devuelve 409.
  - **Admin:**
    - `GET /admin/prescriptions?status=&doctorId=&patientId=&from=&to=&page=&limit=` — acceso total.
- Guards de **ownership**: el doctor sólo ve sus prescripciones; el paciente sólo las suyas. Implementar en service, no en controller.
- Filtros con Prisma `where` dinámico.
- Tests unitarios del service: crear, listar (filtro por rol), consume (válido/inválido).
- Tests e2e: flujo completo doctor crea → paciente consume.

**Entregables:**

- Flujo end-to-end probado en Swagger.
- Commit: `feat(api): prescriptions module with rbac ownership and filters`.

---

### **FASE 5 — PDF y Métricas** ⏱️ ~90 min

**Objetivos:**

- **PDF endpoint:** `GET /prescriptions/:id/pdf`
  - Acceso: paciente dueño + médico autor + admin.
  - Contenido: header con código, datos del paciente, médico, fecha, lista de items (tabla), estado, notes.
  - **QR opcional** con `qrcode` apuntando a `${APP_ORIGIN}/patient/prescriptions/:id`.
  - Genera con `pdfkit` en streaming (Content-Type: `application/pdf`, Content-Disposition: attachment).
- **Métricas admin:** `GET /admin/metrics?from=&to=`
  - `totals`: `{ doctors, patients, prescriptions }` (counts directos).
  - `byStatus`: `{ pending, consumed }` (groupBy en Prisma).
  - `byDay`: array de últimos 30 días (o rango), usar raw SQL si Prisma groupBy no soporta date_trunc (`SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) FROM "Prescription" GROUP BY 1 ORDER BY 1`).
  - `topDoctors`: top 5 por volumen (groupBy authorId + count).
- Cachear métricas 60s con `@nestjs/cache-manager` (decisión documentada).

**Entregables:**

- Descargar PDF desde Swagger.
- Llamar `/admin/metrics` y obtener payload completo.
- Commit: `feat(api): pdf generation with qr and admin metrics endpoint`.

---

### **FASE 6 — Swagger + Tests E2E Backend** ⏱️ ~45 min

**Objetivos:**

- `@nestjs/swagger` en `/docs` con `DocumentBuilder` (Bearer auth, tags por módulo).
- Decorar DTOs con `@ApiProperty()`.
- Suite e2e mínima (Supertest):
  - Auth: login OK, login fail, refresh, protected route sin token.
  - Prescriptions: doctor crea, paciente lista, paciente consume, paciente intenta ver de otro (403).
- `pnpm --filter api test:cov` corriendo y mostrando coverage.

**Entregables:**

- Swagger UI en `http://localhost:3001/docs`.
- Reporte de coverage `>50%` en módulos core.
- Commit: `test(api): e2e suite for auth and prescriptions + swagger docs`.

---

### **FASE 7 — Bootstrap Frontend Next.js** ⏱️ ~60 min

**Objetivos:**

- `apps/web` con Next.js 15 (App Router, TypeScript, Tailwind).
- Instalar: shadcn/ui (init), TanStack Query, axios, zustand, react-hook-form, zod, sonner, recharts, lucide-react.
- Configurar:
  - `lib/api/client.ts` — axios instance con baseURL desde env.
  - `lib/api/interceptors.ts` — interceptor de respuesta: si 401, intenta refresh; si falla, redirige a `/login`.
  - `store/auth.ts` — zustand store con `{ user, accessToken, setSession, clearSession }` persistido en localStorage (sólo access; refresh en cookie HTTP-Only).
  - `middleware.ts` — protección por rol leyendo cookie de access token.
- Theme base: `globals.css` con variables shadcn, fuente Inter.
- `app/layout.tsx` con `<QueryClientProvider>`, `<Toaster>`.

**Entregables:**

- `pnpm --filter web dev` levanta en `:3000`.
- Página `/` redirige a `/login` si no autenticado.
- Commit: `feat(web): next.js scaffold with tanstack query, zustand and shadcn`.

---

### **FASE 8 — Autenticación Frontend** ⏱️ ~60 min

**Objetivos:**

- Página `/login`:
  - Form con react-hook-form + zod (email, password).
  - Estados: loading, error inline.
  - Tras login: guarda sesión, redirige según rol (`admin` → `/admin`, `doctor` → `/doctor/prescriptions`, `patient` → `/patient/prescriptions`).
- `hooks/useAuth.ts` — encapsula login/logout/refresh.
- `components/layout/AppShell.tsx` — sidebar con menú filtrado por rol, topbar con nombre y logout.
- `middleware.ts` redirige a `/login` si no hay cookie; redirige a su home si el rol no coincide con la ruta.

**Entregables:**

- Login con `admin@test.com` → `/admin`.
- Logout limpia sesión + revoca refresh en backend.
- Commit: `feat(web): login flow with rbac route guards`.

---

### **FASE 9 — Frontend Médico** ⏱️ ~90 min

**Objetivos:**

- `/doctor/prescriptions` — listado:
  - TanStack Query con `useInfiniteQuery` o paginación clásica.
  - Filtros (status, fechas) sincronizados con querystring.
  - Tabla con: código, paciente, fecha, estado (badge), acción "Ver".
  - Estados: loading skeleton, empty state, error con retry.
- `/doctor/prescriptions/new` — formulario:
  - Búsqueda de paciente por email (autocomplete usando `/patients?query=`).
  - Items dinámicos con `useFieldArray` (add/remove).
  - Validación zod: al menos 1 item, nombre obligatorio, quantity > 0 si presente.
  - On submit: POST + toast éxito + invalidate query + navegar a detalle.
- `/doctor/prescriptions/[id]` — detalle:
  - Cabecera con código, paciente, fecha, estado.
  - Tabla de items.
  - Acción "Imprimir PDF" (descarga blob).

**Entregables:**

- Flujo completo: crear → ver en listado → ver detalle → descargar PDF.
- Commit: `feat(web): doctor module - list, create and detail prescriptions`.

---

### **FASE 10 — Frontend Paciente** ⏱️ ~60 min

**Objetivos:**

- `/patient/prescriptions` — listado:
  - Cards (mejor en móvil) con código, médico, fecha, estado, acciones.
  - Filtros: status, fechas.
  - Acciones por card: "Marcar consumida" (con confirm dialog), "Descargar PDF".
  - Optimistic update al consumir + rollback en error.
- `/patient/prescriptions/[id]` — detalle:
  - Igual al doctor pero con acciones de paciente.
  - Si entra desde QR del PDF, debe ver el detalle (validar acceso).

**Entregables:**

- Paciente consume una prescripción, ve actualizado el estado, descarga el PDF.
- Commit: `feat(web): patient module - list, consume and pdf download`.

---

### **FASE 11 — Frontend Admin (Dashboard + Métricas)** ⏱️ ~75 min

**Objetivos:**

- `/admin` dashboard:
  - 3 cards de totales (doctores, pacientes, prescripciones) con iconos.
  - Card "Por estado" con donut chart (Recharts).
  - Card "Por día" con line chart (últimos 30 días).
  - Card "Top médicos" con tabla top 5.
  - Filtro de rango de fechas (date picker shadcn) que reload todas las queries.
- `/admin/prescriptions` (opcional, plus): listado global con filtros doctor/patient.

**Entregables:**

- Dashboard rendereado con datos del seed.
- Commit: `feat(web): admin dashboard with metrics charts`.

---

### **FASE 12 — Testing Frontend Mínimo** ⏱️ ~30 min

**Objetivos:**

- Vitest config + setup file con `@testing-library/jest-dom`.
- 1 test de componente: `PrescriptionCard` (renderiza estado, dispara `onConsume`).
- 1 test de hook: `useAuth` (login setea sesión, logout la limpia).

**Entregables:**

- `pnpm --filter web test` pasa.
- Commit: `test(web): component and hook tests`.

---

### **FASE 13 — DevOps: Docker, CI y Deploy** ⏱️ ~60 min

**Objetivos:**

- `apps/api/Dockerfile` multi-stage (deps, build, runtime) — imagen final < 200MB.
- `docker-compose.yml` para dev local: postgres + adminer + api (opcional).
- `.github/workflows/ci.yml`:
  - Job lint+test backend.
  - Job lint+test frontend.
  - Job build (turbo build).
- Variables de entorno para Railway (api) y Vercel (web) documentadas en README.
- Script `pnpm db:migrate:deploy` que use en Railway al deploy.
- Configurar `APP_ORIGIN` en backend para CORS apuntando al dominio de Vercel.

**Entregables:**

- CI verde en main.
- (Idealmente) URLs públicas funcionando — si no hay tiempo, dejar instrucciones detalladas.
- Commit: `chore: docker, ci pipeline and deploy configs`.

---

### **FASE 14 — Documentación Final** ⏱️ ~45 min

**Objetivos:**

- `README.md` raíz con:
  - Descripción del proyecto + capturas/GIF.
  - URLs públicas (si se deployó).
  - Stack y arquitectura (link a `docs/ARCHITECTURE.md`).
  - Setup local paso a paso (con Docker + sin Docker).
  - Variables de entorno (referencia a `.env.example`).
  - Scripts (`pnpm dev`, `pnpm build`, `pnpm test`, `pnpm db:seed`).
  - Credenciales de prueba (los 3 usuarios del seed).
  - Cómo correr migraciones y seed.
  - Estructura del monorepo.
  - Endpoints clave (link a Swagger).
  - Decisiones técnicas (link a `docs/DECISIONS.md`).
  - Roadmap / mejoras pendientes.
- `docs/ARCHITECTURE.md` — diagrama, capas, flujo de auth, flujo de prescripción.
- `docs/DECISIONS.md` — ADRs numerados (ADR-001 al ADR-00X).
- `docs/PROGRESS.md` — log completo de las 14 fases.
- `docs/CONTEXT.md` — **resumen ejecutivo del proyecto para retomar contexto en futuras sesiones**:
  - Qué se construyó (1 párrafo).
  - Stack final.
  - Cómo correrlo en 3 comandos.
  - Mapa mental de carpetas.
  - Decisiones críticas (top 5).
  - Deuda técnica conocida.
  - Próximos pasos sugeridos.

**Entregables:**

- README listo para GitHub (con badges de CI, license, stack).
- Commit: `docs: comprehensive readme, architecture and decision records`.

---

## 📋 INSTRUCCIONES OPERATIVAS PARA CLAUDE CODE

### Antes de empezar

1. **Confirma el plan**: muestra al usuario el resumen de las 14 fases y pide aprobación antes de codear.
2. **Crea `docs/PROGRESS.md`** vacío con la lista de fases y checkboxes `[ ]`.
3. **Pregunta si quieres deploy real** (Railway/Vercel) o sólo dejarlo listo localmente.

### Durante la ejecución

- **Una fase a la vez.** No mezcles fases. Cuando termines una, marca `[x]` en `PROGRESS.md`, commit y avisa al usuario para validar antes de seguir.
- **Si encuentras una decisión no trivial** (ej. cookie vs. localStorage, pdfkit vs. puppeteer), **documéntala en `DECISIONS.md` como ADR** antes de implementarla.
- **Logs concisos al usuario**: 1-2 frases por fase. Detalles en commits y `PROGRESS.md`.
- **Cuando rompas algo**, primero entiende el error, no apliques workarounds. Si necesitas help, pregunta.

### Al finalizar

- Genera `docs/CONTEXT.md` (resumen ejecutivo).
- Genera `README.md` final con todo.
- Crea PR en GitHub o deja la rama lista (si el usuario lo pide).
- Resume al usuario en 5-7 bullets qué se entregó, qué quedó pendiente, y qué estudiar primero (para que se prepare para defender la prueba).

---

## ✅ CHECKLIST DE ACEPTACIÓN (LO QUE EVALUARÁ EL REVISOR)

- [ ] Login funcional con los 3 roles (seed).
- [ ] Guards operativos: doctor no ve recetas de otros doctores; paciente no ve de otros pacientes; admin ve todo.
- [ ] Médico crea prescripción con items dinámicos.
- [ ] Paciente marca prescripción como consumida (status + consumedAt).
- [ ] Descarga PDF funciona y muestra todos los campos.
- [ ] Dashboard admin muestra métricas (totales, por estado, por día).
- [ ] Paginación y filtros funcionan en listados.
- [ ] Migraciones + seed corren limpios desde cero.
- [ ] README suficiente para que cualquiera levante el proyecto.
- [ ] Swagger disponible.
- [ ] Tests pasan.
- [ ] Despliegue funcional (o instrucciones claras de deploy).

---

## 🎁 OPCIONALES (sólo si el core está 100% perfecto)

- [ ] Audit logs (tabla `AuditLog` para cambios de estado).
- [ ] Notificación por email al crear prescripción (nodemailer con preview en dev).
- [ ] Búsqueda full-text por nombre de item / notas (Prisma + `tsvector`).
- [ ] Dark mode con preferencia persistida.
- [ ] SSE para métricas en vivo en `/admin`.
- [ ] Postman/Insomnia collection exportada en `docs/`.

---

## 📚 QUÉ ESTUDIAR (para defender la prueba)

Después de que Claude Code termine, el usuario debe revisar:

1. **`docs/CONTEXT.md`** — visión global en 5 min.
2. **`docs/DECISIONS.md`** — el "porqué" de cada decisión (preguntas más probables del revisor).
3. **`docs/ARCHITECTURE.md`** — diagrama y flujos.
4. **`apps/api/src/modules/auth/`** — entender JWT + refresh rotation (pregunta frecuente).
5. **`apps/api/src/modules/prescriptions/prescriptions.service.ts`** — ownership y filtros (corazón del negocio).
6. **`apps/api/prisma/schema.prisma`** — relaciones e índices.
7. **`apps/web/src/middleware.ts`** y **`store/auth.ts`** — cómo se protege el frontend.
8. **`apps/web/src/lib/api/interceptors.ts`** — cómo se refresca el token transparentemente.

---

## 🚀 COMANDO INICIAL PARA CLAUDE CODE

> Hola Claude Code. Soy un candidato resolviendo una prueba técnica full-stack senior. Lee este documento completo y ejecuta las 14 fases secuencialmente. Antes de empezar, muéstrame el resumen y confírmame que entiendes el alcance. Al terminar cada fase, haz commit, actualiza `docs/PROGRESS.md`, y espera mi visto bueno antes de seguir. Documenta cada decisión técnica no trivial en `docs/DECISIONS.md` como ADR. Al final, genera `docs/CONTEXT.md` y `README.md` listos para GitHub. Vamos.
