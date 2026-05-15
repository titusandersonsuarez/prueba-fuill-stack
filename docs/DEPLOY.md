# Despliegue en Railway (Docker, build desde el repo)

Railway construye las imágenes desde los `Dockerfile` del repo. **No se sube
ninguna imagen a un registro.** Arquitectura: 3 servicios en un mismo proyecto.

```
Railway project
├── Postgres        (plugin gestionado — provee DATABASE_URL)
├── api             (build: apps/api/Dockerfile · contexto: raíz del repo)
└── web             (build: apps/web/Dockerfile · contexto: raíz del repo)
```

> Los `Dockerfile` hacen `COPY` desde la raíz del monorepo, por eso el
> **Root Directory de cada servicio debe ser la raíz del repo** (`/`), y el
> Dockerfile se selecciona con la variable `RAILWAY_DOCKERFILE_PATH`.

La imagen de la API es **autosuficiente**: su entrypoint corre
`prisma migrate deploy` en cada arranque y siembra datos de demo **solo si la
base está vacía** (`apps/api/docker-entrypoint.sh`). No hay que ejecutar nada a
mano tras el deploy.

---

## 1. Crear el proyecto y la base de datos

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → selecciona `prueba-fuill-stack`.
2. En el proyecto: **New** → **Database** → **Add PostgreSQL**. Queda un servicio `Postgres` con `DATABASE_URL` propia.

## 2. Servicio `api`

El servicio creado en el paso 1 será la API. En **Settings** y **Variables**:

| Ajuste                    | Valor                 |
| ------------------------- | --------------------- |
| Root Directory            | `/` (raíz del repo)   |
| `RAILWAY_DOCKERFILE_PATH` | `apps/api/Dockerfile` |

Variables del servicio `api`:

| Variable                 | Valor                                                        |
| ------------------------ | ------------------------------------------------------------ |
| `DATABASE_URL`           | `${{Postgres.DATABASE_URL}}` (referencia al plugin Postgres) |
| `NODE_ENV`               | `production`                                                 |
| `JWT_ACCESS_SECRET`      | cadena aleatoria ≥ 32 chars                                  |
| `JWT_REFRESH_SECRET`     | cadena aleatoria ≥ 32 chars (distinta)                       |
| `JWT_ACCESS_EXPIRES_IN`  | `15m`                                                        |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                                         |
| `APP_ORIGIN`             | URL pública del servicio `web` (rellénala tras el paso 3)    |
| `CORS_ORIGINS`           | misma URL del `web` (sin `/` final)                          |

Deploy. Cuando esté verde, en **Settings → Networking → Generate Domain**.
Anota la URL pública de la API, p. ej. `https://api-xxxx.up.railway.app`.
Verifica `https://<api>/api` (Swagger).

## 3. Servicio `web`

**New** → **GitHub Repo** → mismo repo (segundo servicio). Settings/Variables:

| Ajuste                    | Valor                            |
| ------------------------- | -------------------------------- |
| Root Directory            | `/`                              |
| `RAILWAY_DOCKERFILE_PATH` | `apps/web/Dockerfile`            |
| `NEXT_PUBLIC_API_URL`     | URL pública de la API del paso 2 |

> `NEXT_PUBLIC_API_URL` se **hornea en build time**: el `Dockerfile` la declara
> como `ARG` y Railway pasa las variables del servicio como build args. Si más
> tarde cambia la URL de la API, hay que **redeployar el `web`**.

Deploy → **Generate Domain**. Esa es la URL del frontend.

## 4. Cerrar el círculo

1. En el servicio `api`, pon `APP_ORIGIN` y `CORS_ORIGINS` = URL del `web`.
2. Redeploy del `api` (para que el CORS acepte al frontend).
3. Entra al frontend y loguea con `admin@test.com / admin123` (datos sembrados automáticamente en el primer arranque).

## 5. Actualizar el README

Reemplaza los placeholders `_TODO-..._` de la sección **Despliegue en
producción** del `README.md` por las URLs reales (`web`, `api`, `api/api`).

---

### Notas

- **Puerto**: Railway inyecta `PORT` en runtime; la API lo lee (`ConfigService`, default 3001) y Next standalone también. No definas `PORT` a mano.
- **Migraciones/seed**: las gestiona el entrypoint de la imagen. El seed borra y recrea datos, por eso solo corre cuando la BD está vacía (primer deploy); en redeploys posteriores se conservan los datos.
- **`docker-compose.prod.yml`** sigue siendo el camino de revisión local en un comando; no se usa en Railway.
