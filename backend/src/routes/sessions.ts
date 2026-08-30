import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { sha256 } from "../lib/crypto.js";
import { recordAudit } from "../lib/audit.js";

/** Active login sessions for the current user (DB-backed). */
export async function sessionRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);

  app.get("/sessions", async (req) => {
    const currentRefresh = req.cookies?.ptero_refresh;
    const currentHash = currentRefresh ? sha256(currentRefresh) : null;
    const rows = await prisma.session.findMany({
      where: { userId: req.user.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    return {
      sessions: rows.map((s) => ({
        id: s.id,
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        current: currentHash !== null && s.tokenHash === currentHash,
      })),
    };
  });

  app.delete(
    "/sessions/:id",
    { schema: { params: z.object({ id: z.string() }) } },
    async (req, reply) => {
      await prisma.session.updateMany({
        where: { id: req.params.id, userId: req.user.sub },
        data: { revokedAt: new Date() },
      });
      recordAudit({ userId: req.user.sub, actorName: req.user.name, action: "Revoked a session", type: "AUTH", ip: req.ip });
      return reply.code(204).send();
    },
  );

  app.post("/sessions/revoke-others", async (req, reply) => {
    const currentRefresh = req.cookies?.ptero_refresh;
    const currentHash = currentRefresh ? sha256(currentRefresh) : "";
    await prisma.session.updateMany({
      where: { userId: req.user.sub, revokedAt: null, NOT: { tokenHash: currentHash } },
      data: { revokedAt: new Date() },
    });
    recordAudit({ userId: req.user.sub, actorName: req.user.name, action: "Revoked all other sessions", type: "AUTH", ip: req.ip });
    return reply.code(204).send();
  });
}
