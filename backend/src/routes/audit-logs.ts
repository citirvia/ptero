import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const AUDIT_TYPES = ["AUTH", "SERVER", "DEPLOY", "PERMISSION", "BILLING", "ADMIN", "SYSTEM"] as const;

export async function auditRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);

  app.get(
    "/audit-logs",
    {
      schema: {
        querystring: z.object({
          type: z.enum(AUDIT_TYPES).optional(),
          page: z.coerce.number().int().positive().default(1),
          per_page: z.coerce.number().int().positive().max(100).default(25),
        }),
      },
    },
    async (req) => {
      const { type, page, per_page } = req.query;
      const where: Prisma.AuditLogWhereInput = {
        userId: req.user.sub,
        ...(type ? { type } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * per_page,
          take: per_page,
        }),
        prisma.auditLog.count({ where }),
      ]);
      return {
        logs: items,
        meta: { total, page, perPage: per_page, totalPages: Math.max(1, Math.ceil(total / per_page)) },
      };
    },
  );
}
