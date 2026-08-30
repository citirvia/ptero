import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { recordAudit } from "../lib/audit.js";
import { isAdminRole } from "../plugins/auth.js";
import {
  normalizeSupportAttachments,
  persistSupportAttachments,
  readSupportAttachment,
  toDownloadAttachmentName,
} from "../lib/support-attachments.js";

const TicketCategory = z.enum(["BILLING", "DEPLOYMENT", "NETWORKING", "ACCOUNT", "OTHER"]);
const TicketPriority = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const UserTicketStatus = z.enum(["OPEN", "CLOSED"]);

const ticketCreateBody = z.object({
  subject: z.string().trim().min(4).max(160),
  category: TicketCategory.default("OTHER"),
  priority: TicketPriority.default("NORMAL"),
  message: z.string().trim().min(10).max(10_000),
  serverIdentifier: z.string().trim().max(64).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().int().positive(),
        dataBase64: z.string(),
      }),
    )
    .max(3)
    .optional(),
});

const replyBody = z.object({
  body: z.string().trim().min(1).max(10_000),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().int().positive(),
        dataBase64: z.string(),
      }),
    )
    .max(3)
    .optional(),
});

async function notifyUsers(userIds: string[], title: string, body: string) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;
  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      type: "SYSTEM",
      title,
      body,
    })),
  });
}

const summarySelect = {
  id: true,
  number: true,
  subject: true,
  category: true,
  priority: true,
  status: true,
  serverIdentifier: true,
  firstResponseAt: true,
  resolvedAt: true,
  closedAt: true,
  lastReplyAt: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      body: true,
      internal: true,
      createdAt: true,
      authorName: true,
    },
  },
} as const;

const detailSelect = {
  id: true,
  number: true,
  subject: true,
  category: true,
  priority: true,
  status: true,
  serverIdentifier: true,
  firstResponseAt: true,
  resolvedAt: true,
  closedAt: true,
  lastReplyAt: true,
  createdAt: true,
  updatedAt: true,
  requester: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  messages: {
    where: { internal: false },
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      body: true,
      internal: true,
      createdAt: true,
      authorId: true,
      authorName: true,
      attachments: {
        orderBy: { createdAt: "asc" as const },
        select: {
          id: true,
          name: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
  },
} as const;

export async function supportRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);

  app.get("/support/tickets", async (req) => {
    try {
      const tickets = await prisma.supportTicket.findMany({
        where: { requesterId: req.user.sub },
        orderBy: [{ updatedAt: "desc" }],
        select: summarySelect,
      });
      return { tickets };
    } catch (error) {
      throw error;
    }
  });

  app.get(
    "/support/tickets/:id",
    { schema: { params: z.object({ id: z.string() }) } },
    async (req, reply) => {
      const ticket = await prisma.supportTicket.findFirst({
        where: { id: req.params.id, requesterId: req.user.sub },
        select: detailSelect,
      });
      if (!ticket) {
        return reply.code(404).send({ error: "TicketNotFound", message: "Ticket not found." });
      }
      return { ticket };
    },
  );

  app.get(
    "/support/attachments/:id",
    { schema: { params: z.object({ id: z.string() }) } },
    async (req, reply) => {
      const attachment = await prisma.supportAttachment.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          name: true,
          mimeType: true,
          sizeBytes: true,
          storageKey: true,
          message: {
            select: {
              internal: true,
              ticket: {
                select: {
                  requesterId: true,
                },
              },
            },
          },
        },
      });
      if (!attachment) {
        return reply.code(404).send({ error: "AttachmentNotFound", message: "Attachment not found." });
      }
      if (!isAdminRole(req.user.role)) {
        if (attachment.message.internal || attachment.message.ticket.requesterId !== req.user.sub) {
          return reply.code(403).send({ error: "Forbidden", message: "You cannot access this attachment." });
        }
      }
      const buffer = await readSupportAttachment(attachment.storageKey);
      reply.header("Content-Type", attachment.mimeType || "application/octet-stream");
      reply.header("Content-Length", String(attachment.sizeBytes));
      reply.header("X-Content-Type-Options", "nosniff");
      reply.header(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(toDownloadAttachmentName(attachment.name))}"`,
      );
      return reply.send(buffer);
    },
  );

  app.post(
    "/support/tickets",
    {
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      schema: { body: ticketCreateBody },
    },
    async (req, reply) => {
      const payload = req.body;
      const attachments = normalizeSupportAttachments(payload.attachments);
      const created = await prisma.supportTicket.create({
        data: {
          requesterId: req.user.sub,
          subject: payload.subject,
          category: payload.category,
          priority: payload.priority,
          status: "OPEN",
          serverIdentifier: payload.serverIdentifier || null,
          messages: {
            create: {
              authorId: req.user.sub,
              authorName: req.user.name,
              body: payload.message,
            },
          },
        },
        select: { id: true, messages: { take: 1, orderBy: { createdAt: "desc" }, select: { id: true } } },
      });
      const messageId = created.messages[0]?.id;
      if (messageId && attachments.length > 0) {
        const stored = await persistSupportAttachments(messageId, attachments);
        if (stored.length > 0) {
          await prisma.supportMessage.update({
            where: { id: messageId },
            data: {
              attachments: {
                create: stored,
              },
            },
          });
        }
      }
      const ticket = await prisma.supportTicket.findUniqueOrThrow({
        where: { id: created.id },
        select: detailSelect,
      });

      const admins = await prisma.user.findMany({
        where: { role: { in: ["OWNER", "ADMIN"] }, status: "ACTIVE" },
        select: { id: true },
      });
      await notifyUsers(
        admins.map((admin) => admin.id),
        `New support ticket #${ticket.number}`,
        `${req.user.name} opened "${ticket.subject}".`,
      );

      recordAudit({
        userId: req.user.sub,
        actorName: req.user.name,
        action: "Created support ticket",
        target: `#${ticket.number} ${ticket.subject}`,
        type: "SYSTEM",
        ip: req.ip,
        metadata: {
          category: ticket.category,
          priority: ticket.priority,
        },
      });

      return reply.code(201).send({ ticket });
    },
  );

  app.post(
    "/support/tickets/:id/messages",
    {
      config: { rateLimit: { max: 20, timeWindow: "5 minutes" } },
      schema: { params: z.object({ id: z.string() }), body: replyBody },
    },
    async (req, reply) => {
      const existing = await prisma.supportTicket.findFirst({
        where: { id: req.params.id, requesterId: req.user.sub },
        select: { id: true, number: true, subject: true, status: true, assigneeId: true },
      });
      if (!existing) {
        return reply.code(404).send({ error: "TicketNotFound", message: "Ticket not found." });
      }

      const nextStatus = existing.status === "CLOSED" || existing.status === "RESOLVED"
        ? "OPEN"
        : "WAITING_ON_STAFF";
      const attachments = normalizeSupportAttachments(req.body.attachments);
      const updated = await prisma.supportTicket.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          resolvedAt: null,
          closedAt: null,
          lastReplyAt: new Date(),
          messages: {
            create: {
              authorId: req.user.sub,
              authorName: req.user.name,
              body: req.body.body,
            },
          },
        },
        select: { id: true, messages: { take: 1, orderBy: { createdAt: "desc" }, select: { id: true } } },
      });
      const messageId = updated.messages[0]?.id;
      if (messageId && attachments.length > 0) {
        const stored = await persistSupportAttachments(messageId, attachments);
        if (stored.length > 0) {
          await prisma.supportMessage.update({
            where: { id: messageId },
            data: {
              attachments: {
                create: stored,
              },
            },
          });
        }
      }
      const ticket = await prisma.supportTicket.findUniqueOrThrow({
        where: { id: updated.id },
        select: detailSelect,
      });

      const recipients = existing.assigneeId
        ? [existing.assigneeId]
        : (
            await prisma.user.findMany({
              where: { role: { in: ["OWNER", "ADMIN"] }, status: "ACTIVE" },
              select: { id: true },
            })
          ).map((user) => user.id);
      await notifyUsers(
        recipients,
        `Customer replied on ticket #${ticket.number}`,
        `${req.user.name} sent a new message on "${ticket.subject}".`,
      );

      recordAudit({
        userId: req.user.sub,
        actorName: req.user.name,
        action: "Replied to support ticket",
        target: `#${ticket.number} ${ticket.subject}`,
        type: "SYSTEM",
        ip: req.ip,
      });

      return reply.code(201).send({ ticket });
    },
  );

  app.patch(
    "/support/tickets/:id",
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({ status: UserTicketStatus }),
      },
    },
    async (req, reply) => {
      const existing = await prisma.supportTicket.findFirst({
        where: { id: req.params.id, requesterId: req.user.sub },
        select: { id: true, number: true, subject: true },
      });
      if (!existing) {
        return reply.code(404).send({ error: "TicketNotFound", message: "Ticket not found." });
      }

      const ticket = await prisma.supportTicket.update({
        where: { id: existing.id },
        data:
          req.body.status === "CLOSED"
            ? { status: "CLOSED", closedAt: new Date() }
            : { status: "OPEN", closedAt: null, resolvedAt: null },
        select: detailSelect,
      });

      recordAudit({
        userId: req.user.sub,
        actorName: req.user.name,
        action: req.body.status === "CLOSED" ? "Closed support ticket" : "Reopened support ticket",
        target: `#${ticket.number} ${ticket.subject}`,
        type: "SYSTEM",
        ip: req.ip,
      });

      return { ticket };
    },
  );
}
