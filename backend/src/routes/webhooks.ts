import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { recordAudit } from "../lib/audit.js";
import type { NotificationType } from "@prisma/client";

const EVENT_MAP: Record<string, { type: NotificationType; title: (t: string) => string }> = {
  "server.deployed": { type: "DEPLOY", title: (t) => `Deployed ${t}` },
  "server.installed": { type: "DEPLOY", title: (t) => `${t} finished installing` },
  "server.crashed": { type: "ALERT", title: (t) => `${t} crashed` },
  "server.backup.completed": { type: "SYSTEM", title: (t) => `Backup completed for ${t}` },
  "server.power": { type: "SYSTEM", title: (t) => `Power state changed: ${t}` },
};

/**
 * Inbound webhook from Wings / Pterodactyl (or our own emitters). Verifies an
 * optional HMAC signature, then fans the event out to user notifications and
 * the audit log.
 */
export async function webhookRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/webhooks/events",
    {
      config: { rateLimit: { max: 240, timeWindow: "1 minute" } },
      schema: {
        body: z.object({
          event: z.string(),
          target: z.string().default("server"),
          userEmail: z.string().email().optional(),
          metadata: z.record(z.unknown()).optional(),
        }),
      },
    },
    async (req, reply) => {
      if (!env.WEBHOOK_SECRET) {
        return reply.code(503).send({
          error: "WebhookDisabled",
          message: "Webhook signing secret is not configured.",
        });
      }
      const sig = req.headers["x-signature"];
      const expected =
        "sha256=" +
        createHmac("sha256", env.WEBHOOK_SECRET)
          .update(JSON.stringify(req.body))
          .digest("hex");
      const ok =
        typeof sig === "string" &&
        sig.length === expected.length &&
        timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
      if (!ok) return reply.code(401).send({ error: "BadSignature", message: "Invalid webhook signature." });

      const { event, target, userEmail, metadata } = req.body;
      const mapped = EVENT_MAP[event] ?? {
        type: "SYSTEM" as NotificationType,
        title: (t: string) => `${event}: ${t}`,
      };

      // Resolve recipients: a specific user, or all admins as a fallback.
      const recipients = userEmail
        ? await prisma.user.findMany({ where: { email: userEmail.toLowerCase() } })
        : await prisma.user.findMany({ where: { role: { in: ["OWNER", "ADMIN"] } } });

      if (recipients.length) {
        await prisma.notification.createMany({
          data: recipients.map((u) => ({
            userId: u.id,
            type: mapped.type,
            title: mapped.title(target),
            body: metadata ? JSON.stringify(metadata).slice(0, 500) : `Event ${event} on ${target}.`,
          })),
        });
      }

      recordAudit({
        actorName: "Wings",
        action: `Webhook: ${event}`,
        target,
        type: "SYSTEM",
        metadata: metadata as never,
      });

      return reply.code(202).send({ ok: true, delivered: recipients.length });
    },
  );
}
