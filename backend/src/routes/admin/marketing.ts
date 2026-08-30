import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../lib/prisma.js";

const idParams = z.object({ id: z.string() });

const planRegion = z.enum(["EU", "US", "TR", "GLOBAL"]);
const incidentSeverity = z.enum(["MINOR", "MAJOR", "CRITICAL", "MAINTENANCE"]);
const incidentStatus = z.enum([
  "INVESTIGATING",
  "IDENTIFIED",
  "MONITORING",
  "RESOLVED",
  "SCHEDULED",
  "COMPLETED",
]);
const roadmapStatus = z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]);
const locationStatus = z.enum(["ONLINE", "DEGRADED", "MAINTENANCE", "OFFLINE"]);
const promoCodeType = z.enum(["FIXED_CREDITS", "PERCENT"]);
const promoCodeScope = z.enum(["DEPLOY_DISCOUNT", "CREDIT_BALANCE"]);

// ── Plan ──
const planCreate = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().nullish(),
  ramMb: z.coerce.number().int().nonnegative(),
  cpuPct: z.coerce.number().int().nonnegative(),
  diskMb: z.coerce.number().int().nonnegative(),
  dbCount: z.coerce.number().int().nonnegative().optional(),
  backups: z.coerce.number().int().nonnegative().optional(),
  creditCost: z.coerce.number().int().nonnegative(),
  priceMonth: z.coerce.number().int().nonnegative(),
  priceYear: z.coerce.number().int().nonnegative(),
  region: planRegion.optional(),
  featured: z.boolean().optional(),
  popular: z.boolean().optional(),
  published: z.boolean().optional(),
  sortIndex: z.coerce.number().int().optional(),
});
const planUpdate = planCreate.partial();

// ── Incident ──
const incidentCreate = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  severity: incidentSeverity.optional(),
  status: incidentStatus.optional(),
  services: z.array(z.string()).optional(),
  body: z.string().min(1),
  startedAt: z.coerce.date().optional(),
  resolvedAt: z.coerce.date().nullish(),
});
const incidentUpdate = incidentCreate.partial();

const incidentUpdateCreate = z.object({
  body: z.string().min(1),
  label: z.string().min(1).optional(),
  postedAt: z.coerce.date().optional(),
});

// ── RoadmapItem ──
const roadmapCreate = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.string().min(1).optional(),
  status: roadmapStatus.optional(),
  votes: z.coerce.number().int().nonnegative().optional(),
  eta: z.string().nullish(),
  sortIndex: z.coerce.number().int().optional(),
});
const roadmapUpdate = roadmapCreate.partial();

// ── ChangelogEntry ──
const changelogCreate = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).optional(),
  publishedAt: z.coerce.date().optional(),
});
const changelogUpdate = changelogCreate.partial();

// ── Location ──
const locationCreate = z.object({
  slug: z.string().min(1),
  city: z.string().min(1),
  region: z.string().min(1),
  country: z.string().min(1),
  flag: z.string().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  status: locationStatus.optional(),
  hardware: z.string().min(1),
  capacity: z.coerce.number().int().min(0).max(100).optional(),
  sortIndex: z.coerce.number().int().optional(),
});
const locationUpdate = locationCreate.partial();

// ── Promo codes ──
const promoBase = z.object({
  code: z.string().trim().min(3).max(32),
  label: z.string().trim().max(80).nullish(),
  description: z.string().trim().max(240).nullish(),
  scope: promoCodeScope.optional(),
  type: promoCodeType,
  amount: z.coerce.number().int().positive(),
  maxRedemptions: z.coerce.number().int().positive().nullish(),
  maxPerUser: z.coerce.number().int().positive().optional(),
  active: z.boolean().optional(),
  startsAt: z.coerce.date().nullish(),
  expiresAt: z.coerce.date().nullish(),
});
const promoCreate = promoBase.superRefine((body, ctx) => {
    if (body.scope === "CREDIT_BALANCE" && body.type !== "FIXED_CREDITS") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Coin balance promo codes must use a fixed credit amount.",
        path: ["type"],
      });
    }
  });
const promoUpdate = promoBase.partial().superRefine((body, ctx) => {
  if (body.scope === "CREDIT_BALANCE" && body.type === "PERCENT") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Coin balance promo codes must use a fixed credit amount.",
      path: ["type"],
    });
  }
});

export async function marketingRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // ───────────────────── Plans ─────────────────────
  app.get("/plans", async () => {
    const items = await prisma.plan.findMany({
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
    });
    return { items, meta: { total: items.length } };
  });

  app.post(
    "/plans",
    { schema: { body: planCreate } },
    async (req, reply) => {
      const plan = await prisma.plan.create({ data: req.body });
      return reply.code(201).send({ plan });
    },
  );

  app.patch(
    "/plans/:id",
    { schema: { params: idParams, body: planUpdate } },
    async (req) => {
      const plan = await prisma.plan.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return { plan };
    },
  );

  app.delete(
    "/plans/:id",
    { schema: { params: idParams } },
    async (req, reply) => {
      await prisma.plan.delete({ where: { id: req.params.id } });
      return reply.code(204).send();
    },
  );

  // ───────────────────── Incidents ─────────────────────
  app.get("/incidents", async () => {
    const items = await prisma.incident.findMany({
      orderBy: { startedAt: "desc" },
      include: { updates: { orderBy: { postedAt: "desc" } } },
    });
    return { items, meta: { total: items.length } };
  });

  app.get(
    "/incidents/:id",
    { schema: { params: idParams } },
    async (req) => {
      const incident = await prisma.incident.findUniqueOrThrow({
        where: { id: req.params.id },
        include: { updates: { orderBy: { postedAt: "desc" } } },
      });
      return { incident };
    },
  );

  app.post(
    "/incidents",
    { schema: { body: incidentCreate } },
    async (req, reply) => {
      const incident = await prisma.incident.create({ data: req.body });
      return reply.code(201).send({ incident });
    },
  );

  app.patch(
    "/incidents/:id",
    { schema: { params: idParams, body: incidentUpdate } },
    async (req) => {
      const incident = await prisma.incident.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return { incident };
    },
  );

  app.delete(
    "/incidents/:id",
    { schema: { params: idParams } },
    async (req, reply) => {
      await prisma.incident.delete({ where: { id: req.params.id } });
      return reply.code(204).send();
    },
  );

  app.post(
    "/incidents/:id/updates",
    { schema: { params: idParams, body: incidentUpdateCreate } },
    async (req, reply) => {
      const update = await prisma.incidentUpdate.create({
        data: { ...req.body, incidentId: req.params.id },
      });
      return reply.code(201).send({ update });
    },
  );

  app.delete(
    "/incidents/:id/updates/:updateId",
    {
      schema: {
        params: z.object({ id: z.string(), updateId: z.string() }),
      },
    },
    async (req, reply) => {
      await prisma.incidentUpdate.delete({
        where: { id: req.params.updateId },
      });
      return reply.code(204).send();
    },
  );

  // ───────────────────── Roadmap ─────────────────────
  app.get("/roadmap", async () => {
    const items = await prisma.roadmapItem.findMany({
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
    });
    return { items, meta: { total: items.length } };
  });

  app.post(
    "/roadmap",
    { schema: { body: roadmapCreate } },
    async (req, reply) => {
      const item = await prisma.roadmapItem.create({ data: req.body });
      return reply.code(201).send({ item });
    },
  );

  app.patch(
    "/roadmap/:id",
    { schema: { params: idParams, body: roadmapUpdate } },
    async (req) => {
      const item = await prisma.roadmapItem.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return { item };
    },
  );

  app.delete(
    "/roadmap/:id",
    { schema: { params: idParams } },
    async (req, reply) => {
      await prisma.roadmapItem.delete({ where: { id: req.params.id } });
      return reply.code(204).send();
    },
  );

  // ───────────────────── Changelog ─────────────────────
  app.get("/changelog", async () => {
    const items = await prisma.changelogEntry.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return { items, meta: { total: items.length } };
  });

  app.post(
    "/changelog",
    { schema: { body: changelogCreate } },
    async (req, reply) => {
      const entry = await prisma.changelogEntry.create({ data: req.body });
      return reply.code(201).send({ entry });
    },
  );

  app.patch(
    "/changelog/:id",
    { schema: { params: idParams, body: changelogUpdate } },
    async (req) => {
      const entry = await prisma.changelogEntry.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return { entry };
    },
  );

  app.delete(
    "/changelog/:id",
    { schema: { params: idParams } },
    async (req, reply) => {
      await prisma.changelogEntry.delete({ where: { id: req.params.id } });
      return reply.code(204).send();
    },
  );

  // ───────────────────── Locations (DB-backed) ─────────────────────
  app.get("/locations", async () => {
    const items = await prisma.location.findMany({
      orderBy: [{ sortIndex: "asc" }, { city: "asc" }],
    });
    return { items, meta: { total: items.length } };
  });

  app.post(
    "/locations",
    { schema: { body: locationCreate } },
    async (req, reply) => {
      const location = await prisma.location.create({ data: req.body });
      return reply.code(201).send({ location });
    },
  );

  app.patch(
    "/locations/:id",
    { schema: { params: idParams, body: locationUpdate } },
    async (req) => {
      const location = await prisma.location.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return { location };
    },
  );

  app.delete(
    "/locations/:id",
    { schema: { params: idParams } },
    async (req, reply) => {
      await prisma.location.delete({ where: { id: req.params.id } });
      return reply.code(204).send();
    },
  );

  // ───────────────────── Promo codes ─────────────────────
  app.get("/promos", async () => {
    const items = await prisma.promoCode.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: { _count: { select: { redemptions: true } } },
    });
    return { items, meta: { total: items.length } };
  });

  app.post(
    "/promos",
    { schema: { body: promoCreate } },
    async (req, reply) => {
      const body = req.body as z.infer<typeof promoCreate>;
      const promo = await prisma.promoCode.create({
        data: {
          ...body,
          scope: body.scope ?? "DEPLOY_DISCOUNT",
          code: String(body.code).trim().toUpperCase(),
        },
        include: { _count: { select: { redemptions: true } } },
      });
      return reply.code(201).send({ promo });
    },
  );

  app.patch(
    "/promos/:id",
    { schema: { params: idParams, body: promoUpdate } },
    async (req) => {
      const body = req.body as z.infer<typeof promoUpdate>;
      const promo = await prisma.promoCode.update({
        where: { id: req.params.id },
        data: {
          ...body,
          ...(body.code ? { code: String(body.code).trim().toUpperCase() } : {}),
        },
        include: { _count: { select: { redemptions: true } } },
      });
      return { promo };
    },
  );

  app.delete(
    "/promos/:id",
    { schema: { params: idParams } },
    async (req, reply) => {
      await prisma.promoCode.delete({ where: { id: req.params.id } });
      return reply.code(204).send();
    },
  );
}
