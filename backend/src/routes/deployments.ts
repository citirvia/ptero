import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { loadUserCtx, userOwnsServer } from "../lib/pterodactyl/ownership.js";

const idParam = z.object({ id: z.string().min(1) });

const RANGE_MS: Record<"1h" | "24h" | "7d", number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

/** Serialize bigint values: number if safe, else string. */
function bigintToSafe(n: bigint): number | string {
  return n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : n.toString();
}

/**
 * Per-server ops history (deployments + usage snapshots), backed by Postgres.
 * Mounted under `/api` in app.ts. Ownership matches `/api/servers/*`:
 * only the server owner can access dashboard history routes.
 */
export async function deploymentRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);

  // Ownership guard for every per-server route.
  app.addHook("preHandler", async (req, reply) => {
    const params = req.params as { id?: string };
    if (!params?.id) return;
    const ctx = await loadUserCtx(req.user.sub);
    if (!ctx) return reply.code(401).send({ error: "Unauthorized", message: "Unknown user." });
    const ok = await userOwnsServer(ctx, params.id);
    if (!ok) {
      return reply.code(403).send({
        error: "Forbidden",
        message: "You don't have access to this server.",
      });
    }
  });

  // ── Deployments (most recent 50) ──
  app.get(
    "/servers/:id/deployments",
    { schema: { params: idParam } },
    async (req) => {
      const deployments = await prisma.deployment.findMany({
        where: { serverIdentifier: req.params.id },
        orderBy: { startedAt: "desc" },
        take: 50,
      });
      return { deployments };
    },
  );

  // ── Usage history (snapshot window) ──
  app.get(
    "/servers/:id/usage-history",
    {
      schema: {
        params: idParam,
        querystring: z.object({
          range: z.enum(["1h", "24h", "7d"]).default("1h"),
        }),
      },
    },
    async (req) => {
      const cutoff = new Date(Date.now() - RANGE_MS[req.query.range]);
      const rows = await prisma.usageSnapshot.findMany({
        where: { serverIdentifier: req.params.id, takenAt: { gte: cutoff } },
        orderBy: { takenAt: "asc" },
      });
      const snapshots = rows.map((r) => ({
        takenAt: r.takenAt,
        cpu: r.cpu,
        memBytes: bigintToSafe(r.memBytes),
        diskBytes: bigintToSafe(r.diskBytes),
        rxBytes: bigintToSafe(r.rxBytes),
        txBytes: bigintToSafe(r.txBytes),
      }));
      return { snapshots };
    },
  );
}
