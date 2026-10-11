# Deploy

El template corre con **SQLite + archivos locales** (`public/media/`). Eso sirve tal cual en
un servidor Node con disco persistente; en plataformas serverless hay que cambiar base de
datos y storage.

## Variables de entorno

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `file:./payload.db` (local) · `libsql://…` (Turso) · `postgresql://…` (si cambiás el adapter) |
| `DATABASE_AUTH_TOKEN` | Solo Turso (ver abajo) |
| `PAYLOAD_SECRET` | String aleatorio largo. Distinto por entorno. |
| `NEXT_PUBLIC_SERVER_URL` | `https://tudominio.com` sin barra final. **Requiere rebuild.** |
| `CRON_SECRET` | Para jobs programados (publicación programada). |
| `PREVIEW_SECRET` | Para live preview / drafts. |

Nunca commitees `.env`. En el hosting cargá las variables desde su panel.

## Opción A — VPS / hosting Node con disco (más simple)

Funciona sin cambios de código (SQLite + `public/media`).

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

- Corré detrás de un proxy (Nginx/Caddy) con HTTPS, y un process manager (pm2/systemd).
- Hacé backup de `payload.db` y `public/media/`.
- El `Dockerfile` del template también sirve (montá volúmenes para la DB y `public/media`).

## Opción B — Vercel (serverless)

El disco es efímero, así que:

1. **Base de datos**: Turso (libSQL, compatible con el adapter SQLite actual):
   ```ts
   // src/payload.config.ts
   db: sqliteAdapter({ client: { url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN } }),
   ```
   o pasá a Postgres: `pnpm add @payloadcms/db-postgres` y `postgresAdapter({ pool: { connectionString } })`
   (Vercel Postgres/Neon/Supabase). Con Postgres en producción usá migraciones
   (`pnpm payload migrate:create` / `migrate`).
2. **Medios** (imágenes y clips): `pnpm add @payloadcms/storage-vercel-blob` y en `plugins`:
   ```ts
   vercelBlobStorage({ collections: { media: true }, token: process.env.BLOB_READ_WRITE_TOKEN })
   ```
   Los clips se sirven desde el CDN de Blob; el motor igual los baja como Blob, así que no
   depende de byte-ranges.
3. El seed demo lee `src/endpoints/seed/world/` del disco del proyecto: corré `pnpm seed`
   contra la DB de producción **desde tu máquina** (con las env de prod) en vez de usar el
   botón del admin en Vercel.

## Peso y performance

- Clips desktop ≲ 10 MB c/u (1080p, 8 s, crf 20, GOP 8). Si pesan más, revisá que no sean all-intra.
- Solo el primer clip carga al entrar; el resto se precarga cerca de su escena.
- Poné un CDN delante de `/api/media/file/*` o usá storage con CDN.
