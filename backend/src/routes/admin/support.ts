import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../lib/prisma.js";
import { recordAudit } from "../../lib/audit.js";
import {
  normalizeSupportAttachments,
  persistSupportAttachments,
} from "../../lib/support-attachments.js";

const TicketStatus = z.enum(["OPEN", "WAITING_ON_STAFF", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]);
const TicketPriority = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().optional(),
  status: z.union([TicketStatus, z.literal("ALL")]).default("ALL"),
  priority: z.union([TicketPriority, z.literal("ALL")]).default("ALL"),
  assigneeId: z.string().optional(),
});

const updateBody = z.object({
  status: TicketStatus.optional(),
  priority: TicketPriority.optional(),
  assigneeId: z.string().nullable().optional(),
});

const replyBody = z.object({
  body: z.string().trim().min(1).max(10_000),
  internal: z.boolean().default(false),
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

async function notifyRequester(userId: string, title: string, body: string) {
  await prisma.notification.create({
    data: {
      userId,
      type: "SYSTEM",
      title,
      body,
    },
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

function statusTimestamps(status: z.infer<typeof TicketStatus>) {
  if (status === "RESOLVED") {
    return { resolvedAt: new Date(), closedAt: null };
  }
  if (status === "CLOSED") {
    return { closedAt: new Date() };
  }
  return { resolvedAt: null, closedAt: null };
}

export async function adminSupportRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get("/tickets", { schema: { querystring: listQuery } }, async (req) => {
    const search = req.query.q?.trim();
    const searchClauses: Record<string, unknown>[] = [
      { subject: { contains: search, mode: "insensitive" as const } },
      { requester: { name: { contains: search, mode: "insensitive" as const } } },
      { requester: { email: { contains: search, mode: "insensitive" as const } } },
    ];
    const numericTicket = search && /^\d+$/.test(search) ? Number(search) : null;
    if (numericTicket !== null) {
      searchClauses.push({ number: numericTicket });
    }
    const where = {
      ...(req.query.status !== "ALL" ? { status: req.query.status } : {}),
      ...(req.query.priority !== "ALL" ? { priority: req.query.priority } : {}),
      ...(req.query.assigneeId ? { assigneeId: req.query.assigneeId } : {}),
      ...(search
        ? {
            OR: searchClauses,
          }
        : {}),
    };

    const skip = (req.query.page - 1) * req.query.per_page;
    const [tickets, total, open, waitingOnStaff, waitingOnCustomer, resolved, unassigned] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: req.query.per_page,
        orderBy: [{ updatedAt: "desc" }],
        select: summarySelect,
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.supportTicket.count({ where: { status: "WAITING_ON_STAFF" } }),
      prisma.supportTicket.count({ where: { status: "WAITING_ON_CUSTOMER" } }),
      prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
      prisma.supportTicket.count({ where: { assigneeId: null, status: { not: "CLOSED" } } }),
    ]);

    return {
      tickets,
      meta: {
        total,
        page: req.query.page,
        perPage: req.query.per_page,
        totalPages: Math.max(1, Math.ceil(total / req.query.per_page)),
      },
      counts: {
        open,
        waitingOnStaff,
        waitingOnCustomer,
        resolved,
        unassigned,
      },
    };
  });

  app.get("/tickets/:id", { schema: { params: z.object({ id: z.string() }) } }, async (req, reply) => {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      select: detailSelect,
    });
    if (!ticket) {
      return reply.code(404).send({ error: "TicketNotFound", message: "Ticket not found." });
    }
    return { ticket };
  });

  app.patch("/tickets/:id", { schema: { params: z.object({ id: z.string() }), body: updateBody } }, async (req, reply) => {
    const existing = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        number: true,
        subject: true,
        requesterId: true,
        status: true,
        priority: true,
        assigneeId: true,
      },
    });
    if (!existing) {
      return reply.code(404).send({ error: "TicketNotFound", message: "Ticket not found." });
    }

    if (req.body.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: req.body.assigneeId,
          role: { in: ["OWNER", "ADMIN"] },
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (!assignee) {
        return reply.code(400).send({ error: "InvalidAssignee", message: "Assignee must be an active admin." });
      }
    }

    const nextStatus = req.body.status ?? existing.status;
    const ticket = await prisma.supportTicket.update({
      where: { id: existing.id },
      data: {
        ...(req.body.priority ? { priority: req.body.priority } : {}),
        ...(req.body.assigneeId !== undefined ? { assigneeId: req.body.assigneeId } : {}),
        ...(req.body.status
          ? {
              status: req.body.status,
              ...statusTimestamps(nextStatus),
            }
          : {}),
      },
      select: detailSelect,
    });

    if (req.body.status && req.body.status !== existing.status) {
      await notifyRequester(
        existing.requesterId,
        `Ticket #${ticket.number} updated`,
        `Status changed to ${ticket.status.replaceAll("_", " ").toLowerCase()}.`,
      );
    }

    recordAudit({
      userId: req.user.sub,
      actorName: req.user.name,
      action: "Updated support ticket",
      target: `#${ticket.number} ${ticket.subject}`,
      type: "ADMIN",
      ip: req.ip,
      metadata: {
        previousStatus: existing.status,
        nextStatus: req.body.status ?? existing.status,
        previousPriority: existing.priority,
        nextPriority: req.body.priority ?? existing.priority,
        previousAssigneeId: existing.assigneeId,
        nextAssigneeId: req.body.assigneeId ?? existing.assigneeId,
      },
    });

    return { ticket };
  });

  app.post(
    "/tickets/:id/messages",
    {
      config: { rateLimit: { max: 30, timeWindow: "5 minutes" } },
      schema: { params: z.object({ id: z.string() }), body: replyBody },
    },
    async (req, reply) => {
      const existing = await prisma.supportTicket.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          number: true,
          subject: true,
          requesterId: true,
          firstResponseAt: true,
        },
      });
      if (!existing) {
        return reply.code(404).send({ error: "TicketNotFound", message: "Ticket not found." });
      }

      const attachments = normalizeSupportAttachments(req.body.attachments);
      const updated = await prisma.supportTicket.update({
        where: { id: existing.id },
        data: {
          ...(req.body.internal
            ? {}
            : {
                status: "WAITING_ON_CUSTOMER",
                firstResponseAt: existing.firstResponseAt ?? new Date(),
                lastReplyAt: new Date(),
              }),
          messages: {
            create: {
              authorId: req.user.sub,
              authorName: req.user.name,
              body: req.body.body,
              internal: req.body.internal,
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

      if (!req.body.internal) {
        await notifyRequester(
          existing.requesterId,
          `Reply on ticket #${ticket.number}`,
          `${req.user.name} replied to "${ticket.subject}".`,
        );
      }

      recordAudit({
        userId: req.user.sub,
        actorName: req.user.name,
        action: req.body.internal ? "Added internal support note" : "Replied to support ticket",
        target: `#${ticket.number} ${ticket.subject}`,
        type: "ADMIN",
        ip: req.ip,
      });

      return reply.code(201).send({ ticket });
    },
  );
}
