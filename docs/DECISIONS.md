# Architecture Decision Records (ADRs)

---

## ADR-001: Monorepo con pnpm Workspaces + Turborepo

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** El proyecto tiene dos apps (api, web) y código compartido (tipos/enums). Se necesitan builds eficientes y comandos unificados desde la raíz.

**Decisión:** pnpm workspaces para gestión de dependencias + Turborepo 2 para build orchestration con caché por outputs.

**Consecuencias:**

- ✅ Build caching: solo rebuilds lo que cambia
- ✅ Comandos unificados desde raíz (`pnpm dev`, `pnpm build`, `pnpm test`)
- ✅ `packages/shared` como paquete TypeScript interno sin publicar a npm
- ⚠️ `packages/shared` usa `"main": "./dist/index.js"` en producción; en desarrollo TypeScript resuelve la fuente directamente vía `paths` en tsconfig

---

## ADR-002: NestJS como Modular Monolith

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Se necesita una API robusta con múltiples dominios (auth, prescriptions, users, etc.).

**Decisión:** Cada feature en su propio módulo NestJS con separación controller → service → Prisma. Guards y filtros registrados como providers globales (`APP_GUARD`, `APP_FILTER`).

**Consecuencias:**

- ✅ Cohesión alta dentro de cada módulo; acoplamiento mínimo entre ellos
- ✅ Facilita migrar a microservicios si el proyecto crece
- ✅ Testing aislado por módulo con `@nestjs/testing`
- ⚠️ No es microservicios real; para escala muy alta habría que extraer servicios

---

## ADR-003: Refresh Token Rotation con Familia

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Los JWTs de acceso (15min) expiran rápido. Necesitamos refresh transparente sin pedir credenciales, y protección contra robo de tokens.

**Decisión:** Refresh tokens almacenados **hasheados (SHA-256)** en DB con campo `family` (UUID). Al usar un refresh token: se invalida el actual, se crea uno nuevo en la misma familia. Si se detecta reutilización (token ya revocado), se revoca **toda la familia**.

**Consecuencias:**

- ✅ Detección de token theft: si un atacante roba el refresh, el usuario legítimo invalida la familia al intentar usarlo
- ✅ Logout server-side efectivo (revocar familia = invalidar sesión)
- ✅ SHA-256 sobre bcrypt para tokens de alta entropía: más rápido, el token ya es aleatorio
- ⚠️ Requiere tabla `RefreshToken` en DB; overhead mínimo comparado con el beneficio de seguridad

---

## ADR-004: RBAC con Guards + Decoradores (Secure by Default)

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Tres roles (admin, doctor, patient) con permisos distintos por endpoint.

**Decisión:** `JwtAuthGuard` global (todo protegido por defecto) + `@Public()` para excepciones explícitas + `RolesGuard` global + `@Roles('doctor')` por endpoint. El rol viaja en el JWT payload.

**Consecuencias:**

- ✅ Secure by default: olvidarse de proteger un endpoint es imposible sin `@Public()`
- ✅ Declarativo: el rol requerido es visible en el decorador del handler
- ⚠️ Rol en JWT no se actualiza hasta nuevo login — aceptable dado que los roles no cambian frecuentemente

---

## ADR-005: PDF con pdfkit (no puppeteer)

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Necesitamos generar PDFs de prescripciones con código QR.

**Decisión:** `pdfkit` para generación programática en memoria + `qrcode` para el QR embebido.

**Consecuencias:**

- ✅ Imagen Docker < 200 MB (puppeteer añadiría ~300 MB por Chromium)
- ✅ Sin browser headless: startup instantáneo, sin gestión de procesos
- ✅ PDF se genera en un `Buffer` sin escribir a disco (sin riesgo de fugas de ficheros)
- ⚠️ Layouts tipo "HTML visual" son más difíciles; para el caso de una prescripción estructurada es suficiente

---

## ADR-006: Fetch nativo con `apiClient` wrapper (sin TanStack Query)

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Se consideró TanStack Query para data fetching y caché en el frontend. El proyecto es un challenge con un scope acotado.

**Decisión:** `apiClient` (wrapper sobre `fetch`) con auto-retry en 401 y silent refresh. Componentes Client usan `useEffect + useState` para fetching. Sin librería de server state.

**Consecuencias:**

- ✅ Sin dependencia extra (~50 kB menos en bundle)
- ✅ Control total sobre el ciclo de autenticación (refresh integrado en el cliente)
- ✅ Suficiente para el scope del proyecto
- ⚠️ Sin caché de client-side: cada navegación re-fetcha; aceptable para datos médicos que requieren frescura

---

## ADR-007: Access Token en Cookie No-HTTP-Only + Refresh en HTTP-Only

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Dónde almacenar los tokens. El middleware de Next.js (Edge runtime) necesita leer el token para proteger rutas sin round-trip al servidor.

**Decisión:**

- `refresh_token` → HTTP-Only cookie (inaccesible por JS, protegida de XSS)
- `access_token` → cookie **no-HTTP-Only**, `SameSite=Strict`, expiry 14 min (1 min antes del JWT)

**Consecuencias:**

- ✅ El middleware Edge puede leer `access_token` sin necesidad de un API route proxy
- ✅ El refresh token sigue siendo completamente opaco para JavaScript
- ✅ Expiración corta (14 min) limita la ventana de exposición si el token es robado via XSS
- ⚠️ El access token es técnicamente accesible desde JS — mitigado por la vida corta y `SameSite=Strict`

---

## ADR-008: Índices Compuestos en Prescription

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Los listados filtran por `status + createdAt`, y hay lookups frecuentes por `patientId` o `authorId`.

**Decisión:**

- `@@index([status, createdAt])` — listados filtrados con ordenamiento
- `@@index([patientId])` — lookup de prescripciones de un paciente
- `@@index([authorId])` — lookup de prescripciones de un médico

**Consecuencias:**

- ✅ Queries de listado O(log n) en vez de full scan
- ✅ Cubiertos los 3 patrones de acceso del negocio
- ⚠️ Overhead de escritura mínimo — prescripciones se crean, no se actualizan frecuentemente

---

## ADR-009: Caché de Métricas en Memoria (60s)

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** `GET /metrics` implica varios `groupBy` y `count` sobre tablas grandes. Puede ser costoso bajo carga en el dashboard admin.

**Decisión:** `@nestjs/cache-manager` con `@CacheKey` y `@CacheTTL(60)` en el endpoint de métricas.

**Consecuencias:**

- ✅ Reduce carga en DB para el dashboard admin
- ✅ Lag máximo de 60 s aceptable para métricas de negocio
- ⚠️ En producción multi-instancia habría que migrar a Redis; deuda técnica documentada

---

## ADR-010: Zustand 5 con Persist (solo `user`, no token)

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Estado de auth necesita persistir entre recargas de página. El access token no debe vivir en `localStorage` por seguridad y porque vive en cookie.

**Decisión:** Zustand `persist` middleware con `partialize: (state) => ({ user: state.user })`. El token no se persiste en localStorage — vive en la cookie `access_token`.

**Consecuencias:**

- ✅ El usuario mantiene su sesión (nombre, rol) entre recargas sin re-login
- ✅ El token nunca toca `localStorage` (la cookie HTTP no es accesible vía `localStorage.getItem`)
- ✅ En cold start con `user` en store pero sin cookie, `Providers` hace silent refresh automático

---

## ADR-011: Silent Refresh en Providers (no interceptor de axios)

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Cuando la página carga con `user` en localStorage pero la cookie `access_token` ha expirado (sesión más antigua de 14 min), el usuario vería un error o pantalla en blanco.

**Decisión:** El componente `Providers` (raíz del layout dashboard) detecta `user && !token` y llama a `POST /auth/refresh` con `credentials: 'include'`. Si responde 200, actualiza la cookie y el store. Si no, limpia el estado y redirige a login.

**Consecuencias:**

- ✅ UX fluida: el usuario no experimenta deslogueos inesperados tras inactividad corta
- ✅ `apiClient` también hace retry en 401 para cubrir el caso de que el token expire durante la sesión activa
- ⚠️ Dos mecanismos de refresh (Providers + apiClient retry); son complementarios: Providers actúa al cargar, apiClient durante la sesión

---

## ADR-012: Next.js Standalone Output para Docker

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** Para producción Docker, se necesita una imagen Next.js mínima que no incluya dev deps.

**Decisión:** `output: 'standalone'` en `next.config.ts` + `outputFileTracingRoot` apuntando a la raíz del monorepo. La imagen runner solo copia `.next/standalone`, `.next/static` y `public`.

**Consecuencias:**

- ✅ Imagen web ~80% más pequeña que con `next start` tradicional
- ✅ Node.js nativo sin wrapper: `CMD ["node", "apps/web/server.js"]`
- ✅ `outputFileTracingRoot` garantiza que los ficheros de `packages/shared` se incluyen en el tracing
- ⚠️ `NEXT_PUBLIC_API_URL` se bake en build time; cambiar la URL del API requiere reconstruir la imagen

---

## ADR-013: Jest + React Testing Library (sin Vitest)

**Estado:** Adoptado · **Fecha:** 2026-05-14

**Contexto:** El API ya usa Jest + ts-jest. El frontend necesita una suite de tests de componentes.

**Decisión:** Jest 30 + `next/jest` (SWC transformer) + React Testing Library 16 para el frontend. Mismo runner que el API.

**Consecuencias:**

- ✅ Un solo runner para todo el monorepo — configuración y scripts unificados
- ✅ `next/jest` con SWC: transformación más rápida que Babel, soporte nativo para `'use client'`
- ✅ React Testing Library fuerza tests centrados en comportamiento de usuario, no en implementación
- ⚠️ Fix requerido: `createJestConfig` de `next/jest` no resuelve `@/` en `jest.mock()` en Jest 30 → añadir `'^@/(.*)$'` explícito en `moduleNameMapper`
