import fp from "fastify-plugin";
import type { AuditType } from "@prisma/client";
import type { FastifyRequest } from "fastify";
import { recordAudit } from "../lib/audit.js";

/**
 * Global audit-log middleware.
 *
 * Records an `AuditLog` row on `onResponse` for every authenticated mutating
 * request that completes with a non-5xx status. Skips a small allowlist of
 * very noisy routes (token refresh, health, notification reads).
 *
 * Manual smoke test (assuming dev backend running with a logged-in cookie):
 *
 *   curl -X POST http://localhost:4000/api/account/profile \
 *        -H 'content-type: application/json' \
 *        -b 'ptero_session=<token>' \
 *        -d '{"name":"Smoke Test"}'
 *   # then check the DB: psql $DATABASE_URL -c \
 *   #   "select action, target, type, metadata from \"AuditLog\" order by \"createdAt\" desc limit 5;"
 */

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Routes whose mutations we deliberately do NOT audit (too noisy / not interesting).
const OPT_OUT_ROUTES = new Set([
  "/api/auth/refresh",
  "/health",
  "/api/notifications/:id/read",
  "/api/notifications/read-all",
]);

/**
 * Compact action verb table. Each entry is `[method, suffix-or-fragment, verb]`.
 * The suffix is matched against the end of the routerPath (so the per-server
 * `/api/servers/:id/...` and admin variants both resolve).
 */
type Mapping = { method: string; match: string; verb: (req: FastifyRequest) => string };

const ACTION_MAP: Mapping[] = [
  { method: "POST", match: "/api/auth/login", verb: () => "Signed in" },
  { method: "POST", match: "/api/auth/logout", verb: () => "Signed out" },
  { method: "POST", match: "/api/auth/register", verb: () => "Registered account" },
  {
    method: "POST",
    match: "/power",
    verb: (req) => {
      const body = (req.body ?? {}) as { signal?: string };
      return `Sent ${body.signal ?? "power"} signal`;
    },
  },
  { method: "POST", match: "/command", verb: () => "Sent console command" },
  { method: "POST", match: "/files/write", verb: () => "Wrote file" },
  { method: "POST", match: "/files/delete", verb: () => "Deleted files" },
  { method: "POST", match: "/files/create-folder", verb: () => "Created folder" },
  { method: "POST", match: "/files/copy", verb: () => "Copied file" },
  { method: "POST", match: "/files/compress", verb: () => "Compressed files" },
  { method: "POST", match: "/files/decompress", verb: () => "Decompressed file" },
  { method: "PUT", match: "/files/rename", verb: () => "Renamed files" },
  { method: "POST", match: "/backups/:backup/restore", verb: () => "Restored backup" },
  { method: "POST", match: "/backups/:backup/lock", verb: () => "Toggled backup lock" },
  { method: "POST", match: "/backups", verb: () => "Created backup" },
  { method: "DELETE", match: "/backups/:backup", verb: () => "Deleted backup" },
  { method: "POST", match: "/databases/:db/rotate-password", verb: () => "Rotated database password" },
  { method: "POST", match: "/databases", verb: () => "Created database" },
  { method: "DELETE", match: "/databases/:db", verb: () => "Deleted database" },
  { method: "POST", match: "/suspend", verb: () => "Suspended server" },
  { method: "POST", match: "/unsuspend", verb: () => "Unsuspended server" },
  { method: "POST", match: "/reinstall", verb: () => "Reinstalled server" },
  { method: "POST", match: "/api/admin/servers/provision", verb: () => "Provisioned server" },
  { method: "DELETE", match: "/api/admin/users/:id", verb: () => "Deleted user" },
  { method: "POST", match: "/api/admin/users", verb: () => "Created user" },
  { method: "PATCH", match: "/api/admin/users/:id", verb: () => "Updated user" },
  { method: "DELETE", match: "/api/admin/servers/:id", verb: () => "Deleted server" },
  { method: "POST", match: "/api/admin/servers", verb: () => "Created server" },
  { method: "POST", match: "/settings/rename", verb: () => "Renamed server" },
  { method: "PUT", match: "/settings/docker-image", verb: () => "Updated docker image" },
];

function resolveAction(req: FastifyRequest, routerPath: string): string {
  for (const m of ACTION_MAP) {
    if (m.method !== req.method) continue;
    if (routerPath === m.match || routerPath.endsWith(m.match)) {
      return m.verb(req);
    }
  }
  return `${req.method} ${routerPath}`;
}

function resolveType(routerPath: string): AuditType {
  if (routerPath.startsWith("/api/auth/")) return "AUTH";
  if (routerPath.startsWith("/api/admin/")) return "ADMIN";
  if (routerPath.startsWith("/api/servers/")) return "SERVER";
  if (
    routerPath.startsWith("/api/account") ||
    routerPath.startsWith("/api/settings/") ||
    routerPath.startsWith("/api/api-keys") ||
    routerPath.startsWith("/api/sessions")
  ) {
    return "PERMISSION";
  }
  return "SYSTEM";
}

function joinParams(params: unknown): string | undefined {
  if (!params || typeof params !== "object") return undefined;
  const vals = Object.values(params as Record<string, unknown>)
    .filter((v) => v !== undefined && v !== null && v !== "")
    .map((v) => String(v));
  return vals.length ? vals.join("/") : undefined;
}

export default fp(async (app) => {
  app.addHook("onResponse", async (req, reply) => {
    try {
      if (!MUTATING_METHODS.has(req.method)) return;
      if (reply.statusCode >= 500) return;
      const user = req.user;
      if (!user?.sub) return;

      // `routerPath` is the matched route template (e.g. /api/servers/:id/power).
      // Fastify 5 exposes it as `routeOptions.url`; fall back to the legacy field
      // for resilience.
      const routerPath: string =
        (req as unknown as { routeOptions?: { url?: string } }).routeOptions?.url ??
        (req as unknown as { routerPath?: string }).routerPath ??
        req.url;

      if (OPT_OUT_ROUTES.has(routerPath)) return;

      const action = resolveAction(req, routerPath);
      const type = resolveType(routerPath);
      const target = joinParams(req.params);

      recordAudit({
        userId: user.sub,
        actorName: user.name,
        action,
        target,
        type,
        ip: req.ip,
        metadata: {
          statusCode: reply.statusCode,
          method: req.method,
          route: routerPath,
        },
      });
    } catch (err) {
      req.log.warn({ err }, "audit middleware failed");
    }
  });
});
