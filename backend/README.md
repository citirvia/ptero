# Ptero Backend (BFF)

Enterprise **Fastify + TypeScript** backend for the Ptero panel. It is a
Backend-for-Frontend that authenticates users, then proxies the
**Pterodactyl Panel** (`panel.playboi.cc`) and **Wings** (`node.playboi.cc`)
APIs — including a realtime console WebSocket relay.

```
 Browser (Next.js)  ⇄  this BFF  ⇄  Pterodactyl Panel API  ⇄  Wings daemon
        JWT/cookie        ptla_/ptlc_ keys      wss console relay
```

## Why a BFF?
The Pterodactyl Client/Application keys must never reach the browser. This
service holds them server-side, issues its own short-lived JWT sessions to the
frontend, normalizes every Pterodactyl response, and relays the Wings console
socket (the browser can't attach the Wings token itself).

## Quick start
```bash
cd backend
cp .env.example .env      # then fill in the values below
npm install
npm run dev               # http://localhost:4000  (pretty logs)
# production:
npm run build && npm start
```

## Configuration (`.env`)
| Var | Required | What it is |
|---|---|---|
| `PTERO_PANEL_URL` | ✅ | Panel base URL, e.g. `https://panel.playboi.cc` |
| `PTERO_APP_KEY` | for `/admin/*` | Application API key (`ptla_…`) — Admin → Application API |
| `PTERO_CLIENT_KEY` | for `/servers/*` | Client API key (`ptlc_…`) — Account → API Credentials |
| `JWT_SECRET` | ✅ | ≥16-char secret for session tokens |
| `AUTH_ADMIN_EMAIL` / `AUTH_ADMIN_PASSWORD` | ✅ | login credentials (single-tenant; swap for SSO in prod) |
| `CORS_ORIGIN` | ✅ | frontend origin(s), comma-separated |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Prisma) |
| `ENCRYPTION_KEY` | ✅ | ≥16-char secret; AES-256-GCM encrypts per-user panel keys |
| `PTERO_ALLOW_INSECURE_TLS` | – | `true` only for self-signed dev panels |
| `WINGS_NODE_FQDN` | – | informational; socket URLs come from the panel |

Without the Pterodactyl keys the service still boots — those routes return
`501 MissingApiKey` so you can develop the auth layer first.

## Endpoints
All under `/api`. `🔒` = requires session, `👑` = requires admin.

**Auth** — `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` 🔒
**Account** 🔒 — `GET /account`, `GET /account/api-keys`

**Servers (Client API)** 🔒
- `GET /servers`, `GET /servers/:id`, `GET /servers/:id/resources`
- `POST /servers/:id/power` `{signal}`, `POST /servers/:id/command` `{command}`
- `GET /servers/:id/console` — **WebSocket** console relay (`?token=<jwt>`)
- Files: `GET …/files?directory=`, `…/files/contents?file=`, `POST …/files/write`,
  `GET …/files/download`, `GET …/files/upload`, `PUT …/files/rename`,
  `POST …/files/{copy,compress,decompress,delete,create-folder}`
- Databases: `GET/POST …/databases`, `POST …/databases/:db/rotate-password`, `DELETE …/databases/:db`
- Backups: `GET/POST …/backups`, `…/backups/:b/{download,lock,restore}`, `DELETE …/backups/:b`
- Schedules: `GET/POST …/schedules`, `POST/DELETE …/schedules/:s`
- Network: `GET/POST …/network`, `…/network/:a/{primary,notes}`, `DELETE …/network/:a`
- Startup: `GET …/startup`, `PUT …/startup/variable`
- Settings: `POST …/settings/{rename,reinstall}`, `PUT …/settings/docker-image`
- Activity: `GET …/activity`

**Admin (Application API)** 👑
- `GET /admin/stats` (aggregated users/servers/nodes/capacity)
- Users: `GET/POST /admin/users`, `GET/PATCH/DELETE /admin/users/:id`
- Nodes: `GET /admin/nodes`, `GET /admin/nodes/:id`, `GET /admin/nodes/:id/allocations`
- `GET /admin/locations`
- Servers: `GET/POST /admin/servers`, `GET /admin/servers/:id`,
  `POST /admin/servers/:id/{suspend,unsuspend,reinstall}`, `DELETE /admin/servers/:id`
- `GET /admin/nests`, `GET /admin/nests/:nest/eggs`

## Wiring the frontend
1. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in the Next app.
2. Use the typed client at `src/lib/api.ts` (added in the frontend repo).
3. Replace the mock-data imports in dashboard pages with `useQuery` calls
   (TanStack Query is already installed) hitting that client. The response
   shapes mirror the Pterodactyl attributes in `src/lib/pterodactyl/types.ts`.
4. Console page: open `new WebSocket(\`${WS_API}/api/servers/${id}/console?token=${jwt}\`)`,
   send `{event:"send command",args:[cmd]}`, render `console output` events.

## Security
- Helmet, CORS allow-list, per-route rate limiting (login is throttled to 10/min).
- JWT in an httpOnly cookie **and** Bearer header; admin routes gated separately.
- Pterodactyl keys stay server-side; the browser only ever sees BFF JWTs.

## Database (PostgreSQL + Prisma)
The app layer the panel doesn't own is persisted in Postgres: **users, rotating
sessions, API keys, audit logs, notifications, teams**. Per-user Pterodactyl
client keys are stored **AES-256-GCM encrypted**; passwords use scrypt.

```bash
# local dev DB (compose just the postgres service)
docker compose up -d postgres
npx prisma migrate dev      # create/apply migrations
npm run db:seed             # create the OWNER admin from AUTH_ADMIN_*
npm run prisma:studio       # browse data (optional)
```
Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`.

### DB-backed endpoints (beyond the Pterodactyl proxy)
- Auth 🔒 — `POST /auth/register`, `/auth/login`, `/auth/refresh` (rotating), `/auth/logout`, `GET /auth/me`
- `GET /api/notifications`, `POST …/:id/read`, `POST …/read-all`, `DELETE …/:id`
- `GET /api/audit-logs` 👑 (filter by `type`/`actor`, paginated)
- `GET /api/team`, `POST /api/team/invite` 👑, `PATCH /api/team/:id/role` 👑, `DELETE /api/team/:id` 👑
- `GET/POST /api/api-keys`, `DELETE /api/api-keys/:id` (token shown once)
- `PATCH /api/settings/{profile,preferences}`, `POST /api/settings/password`,
  `PUT/DELETE /api/settings/panel-key` (stores the user's encrypted `ptlc_` key)

## Docker (full stack)
```bash
cp .env.example .env       # fill in panel keys, JWT_SECRET, ENCRYPTION_KEY
docker compose up -d --build          # postgres + backend
docker compose exec backend npm run db:seed   # one-time admin seed
# → API on http://localhost:4000  (migrations run automatically on boot)
```
The backend container runs `prisma migrate deploy` on start, so deploys apply
pending migrations automatically.
