import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";

const leadBody = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  company: z.string().trim().min(2).max(120),
  teamSize: z.string().trim().min(1).max(32),
  message: z.string().trim().max(2000).optional(),
  website: z.string().trim().max(200).optional(),
});
type LeadBody = z.infer<typeof leadBody>;

export async function salesLeadRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/sales-leads",
    {
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      schema: { body: leadBody },
    },
    async (req, reply) => {
      const body = req.body as LeadBody;
      const now = new Date();
      const recentThreshold = new Date(now.getTime() - 15 * 60_000);

      if (body.website) {
        await prisma.salesLead.create({
          data: {
            name: body.name,
            email: body.email.toLowerCase(),
            company: body.company,
            teamSize: body.teamSize,
            message: body.message,
            status: "SPAM",
          },
        });
        return reply.code(202).send({ ok: true });
      }

      const duplicate = await prisma.salesLead.findFirst({
        where: {
          email: body.email.toLowerCase(),
          company: body.company,
          createdAt: { gte: recentThreshold },
        },
      });

      if (duplicate) {
        return reply.code(409).send({
          error: "DuplicateLead",
          message: "We already received a recent request from this company. Please wait a few minutes before sending another one.",
        });
      }

      const lead = await prisma.salesLead.create({
        data: {
          name: body.name,
          email: body.email.toLowerCase(),
          company: body.company,
          teamSize: body.teamSize,
          message: body.message,
        },
      });

      return reply.code(201).send({ lead });
    },
  );
}
