# Progress Log — Prescriptions App

## Phases

- [x] **FASE 0** — Bootstrap del Monorepo
- [ ] **FASE 1** — Modelado de Datos y Prisma
- [ ] **FASE 2** — Autenticación JWT + Refresh Token
- [ ] **FASE 3** — Módulos de Usuarios, Pacientes y Médicos
- [ ] **FASE 4** — Módulo de Prescripciones (Core)
- [ ] **FASE 5** — PDF y Métricas
- [ ] **FASE 6** — Swagger + Tests E2E Backend
- [ ] **FASE 7** — Bootstrap Frontend Next.js
- [ ] **FASE 8** — Autenticación Frontend
- [ ] **FASE 9** — Frontend Médico
- [ ] **FASE 10** — Frontend Paciente
- [ ] **FASE 11** — Frontend Admin (Dashboard + Métricas)
- [ ] **FASE 12** — Testing Frontend Mínimo
- [ ] **FASE 13** — DevOps: Docker, CI y Deploy
- [ ] **FASE 14** — Documentación Final

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
