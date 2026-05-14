# Architecture Decision Records (ADRs)

## ADR-001: Monorepo con pnpm Workspaces + Turborepo

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** El proyecto tiene dos apps (api, web) y código compartido (tipos). Necesitamos builds eficientes y comandos unificados.

**Decisión:** pnpm workspaces para gestión de dependencias + Turborepo para build orchestration con caché inteligente.

**Consecuencias:**

- ✅ Build caching: solo rebuilds lo que cambia
- ✅ Comandos unificados desde raíz (`pnpm dev`, `pnpm build`, `pnpm test`)
- ✅ Deploy independiente: cada app puede deployarse a su plataforma (Railway/Vercel)
- ✅ Tipos compartidos sin duplicación (packages/shared)
- ⚠️ Curva de aprendizaje para configurar turbo.json correctamente

---

## ADR-002: NestJS como Modular Monolith

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** Se necesita una API robusta con múltiples dominios (auth, prescriptions, users, etc.).

**Decisión:** Cada feature en su propio módulo NestJS con separación por capas (controller → service → repository via Prisma).

**Consecuencias:**

- ✅ Cohesión alta dentro de cada módulo
- ✅ Facilita migrar a microservicios si el proyecto crece (cada módulo ya tiene sus fronteras)
- ✅ Testing aislado por módulo
- ⚠️ No es microservicios real; para escala muy alta habría que extraer servicios

---

## ADR-003: Refresh Token Rotation con Familia

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** Los JWTs de acceso (15min) expiran rápido; necesitamos refresh sin pedir credenciales. Debemos proteger contra robo de tokens.

**Decisión:** Refresh tokens almacenados **hasheados** en DB con campo `family` (UUID). Cuando se usa un refresh token:

1. Se invalida el token actual
2. Se crea uno nuevo en la misma familia
3. Si se detecta reutilización (token ya revocado), se revoca TODA la familia

**Consecuencias:**

- ✅ Protección contra token theft: si atacante roba el refresh, el dueño legítimo detectará la revocación al intentar usar su copia
- ✅ Logout server-side efectivo
- ⚠️ Requiere tabla en DB (RefreshToken); overhead mínimo vs. el beneficio de seguridad

---

## ADR-004: RBAC con Guards + Decorators

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** Tres roles (admin, doctor, patient) con permisos distintos por endpoint.

**Decisión:** `JwtAuthGuard` global (todo protegido por defecto) + `@Public()` para excepciones + `RolesGuard` global + `@Roles('doctor')` por endpoint. El rol viaja en el JWT payload.

**Consecuencias:**

- ✅ Secure by default: olvidarse de proteger un endpoint es imposible sin `@Public()`
- ✅ Declarativo: el rol requerido es visible en el decorador
- ⚠️ Rol en JWT no se actualiza hasta nuevo login (aceptable: roles no cambian frecuentemente)

---

## ADR-005: PDF con pdfkit (no puppeteer)

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** Necesitamos generar PDFs de prescripciones.

**Decisión:** `pdfkit` para generación programática.

**Consecuencias:**

- ✅ Imagen Docker < 200MB (puppeteer añade ~300MB por Chromium)
- ✅ No necesita browser headless: menor tiempo de startup, menos memoria
- ✅ Suficiente para el layout de prescripción (texto estructurado + tabla)
- ⚠️ Layouts complejos tipo "HTML visual" son más difíciles que con puppeteer

---

## ADR-006: TanStack Query (React Query) en Frontend

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** Necesitamos data fetching con caché, loading states, y sincronización tras mutaciones.

**Decisión:** TanStack Query v5 para toda la lógica de server state.

**Consecuencias:**

- ✅ Caché automático con staleTime configurable
- ✅ Refetch en focus/reconnect (datos siempre frescos)
- ✅ `invalidateQueries` tras mutaciones = UI consistente
- ✅ Optimistic updates para mejorar UX (consume de prescripción)
- ⚠️ Zustand solo para auth state (client-side); no mezclar con server state

---

## ADR-007: Cookies HTTP-Only para Refresh, Bearer para Access Token

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** Dónde almacenar los tokens para máxima seguridad.

**Decisión:**

- `refreshToken` → cookie HTTP-Only, Secure, SameSite=Strict (no accesible por JS)
- `accessToken` → memoria (Zustand store) o localStorage con rotación frecuente (15min)

**Consecuencias:**

- ✅ El refresh token no es robable via XSS (no accesible por JavaScript)
- ✅ Logout server-side: revocar el refresh en DB invalida la sesión aunque el access siga vigente 15min
- ⚠️ Requiere que el backend setee la cookie correctamente con el dominio de producción

---

## ADR-008: Índices Compuestos en Prescription

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** Los listados filtran por status + createdAt (admin/doctor), y lookups por patientId o authorId.

**Decisión:**

- `@@index([status, createdAt])` para listados filtrados con ordenamiento
- `@@index([patientId])` para lookup paciente
- `@@index([authorId])` para lookup médico

**Consecuencias:**

- ✅ Queries de listado O(log n) en vez de full scan
- ✅ Cubiertos los 3 patrones de acceso principales
- ⚠️ Overhead de escritura mínimo (prescripciones se crean, no se actualizan frecuentemente)

---

## ADR-009: Cache de Métricas con @nestjs/cache-manager (60s)

**Estado:** Adoptado
**Fecha:** 2026-05-14

**Contexto:** El endpoint `/admin/metrics` implica varios aggregations sobre la tabla Prescription; puede ser costoso bajo carga.

**Decisión:** Cache en memoria de 60 segundos usando `@nestjs/cache-manager` con `@CacheKey` y `@CacheTTL`.

**Consecuencias:**

- ✅ Reduce carga en DB para usuarios del dashboard admin
- ✅ Dato "casi en tiempo real" (lag máximo 60s) aceptable para métricas
- ⚠️ En producción multi-instancia habría que cambiar a Redis; documentado como deuda técnica
