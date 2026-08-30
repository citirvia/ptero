import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { randomToken, sha256 } from "../lib/crypto.js";
import { recordAudit } from "../lib/audit.js";

export async function apiKeyRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);

  app.get("/api-keys", async (req) => {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    });
    return { keys };
  });

  app.post(
    "/api-keys",
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          scopes: z.array(z.string()).default([]),
          expiresAt: z.coerce.date().nullish(),
        }),
      },
    },
    async (req, reply) => {
      const secret = randomToken(24);
      const token = `ptbk_${secret}`;
      const prefix = token.slice(0, 13);
      const key = await prisma.apiKey.create({
        data: {
          userId: req.user.sub,
          name: req.body.name,
          prefix,
          keyHash: sha256(token),
          scopes: req.body.scopes,
          expiresAt: req.body.expiresAt ?? null,
        },
      });
      recordAudit({ userId: req.user.sub, actorName: req.user.name, action: "Created API key", target: key.name, type: "PERMISSION", ip: req.ip });
      // Plaintext token is returned exactly once.
      return reply.code(201).send({ id: key.id, name: key.name, token, prefix, scopes: key.scopes });
    },
  );

  app.delete(
    "/api-keys/:id",
    { schema: { params: z.object({ id: z.string() }) } },
    async (req, reply) => {
      await prisma.apiKey.deleteMany({ where: { id: req.params.id, userId: req.user.sub } });
      recordAudit({ userId: req.user.sub, actorName: req.user.name, action: "Revoked API key", type: "PERMISSION", ip: req.ip });
      return reply.code(204).send();
    },
  );
}
