import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";

export async function notificationRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);

  app.get("/notifications", async (req) => {
    const items = await prisma.notification.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = items.filter((n) => !n.read).length;
    return { notifications: items, unread };
  });

  app.post(
    "/notifications/:id/read",
    { schema: { params: z.object({ id: z.string() }) } },
    async (req, reply) => {
      await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user.sub },
        data: { read: true },
      });
      return reply.code(204).send();
    },
  );

  app.post("/notifications/read-all", async (req, reply) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.sub, read: false },
      data: { read: true },
    });
    return reply.code(204).send();
  });

  app.delete(
    "/notifications/:id",
    { schema: { params: z.object({ id: z.string() }) } },
    async (req, reply) => {
      await prisma.notification.deleteMany({
        where: { id: req.params.id, userId: req.user.sub },
      });
      return reply.code(204).send();
    },
  );
}
