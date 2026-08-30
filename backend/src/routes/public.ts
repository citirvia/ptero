import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { pteroApp } from "../lib/pterodactyl/application.js";
import { prisma } from "../lib/prisma.js";

/**
 * Public, unauthenticated endpoints for the marketing site.
 *
 * Two flavors live here:
 *   - DB-backed CMS reads (`/public/plans`, `/public/incidents`,
 *     `/public/roadmap`, `/public/changelog`, `/public/locations`) sourced
 *     from the marketing CMS tables in Postgres.
 *   - Live panel-derived facts (`/public/panel-locations`, `/public/status`)
 *     computed from the Pterodactyl panel.
 *
 * All routes are IP rate-limited (60/min) to discourage scraping.
 */
export async function publicRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const rateLimit = { rateLimit: { max: 60, timeWindow: "1 minute" } };

  // ── Plans (DB) ──
  app.get("/public/plans", { config: rateLimit }, async () => {
    const items = await prisma.plan.findMany({
      where: { published: true },
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
    });
    return { items };
  });

  // ── Incidents (DB) ──
  app.get(
    "/public/incidents",
    {
      config: rateLimit,
      schema: {
        querystring: z.object({
          limit: z.coerce.number().int().positive().max(100).default(20),
        }),
      },
    },
    async (req) => {
      const items = await prisma.incident.findMany({
        orderBy: { startedAt: "desc" },
        take: req.query.limit,
        include: { updates: { orderBy: { postedAt: "desc" } } },
      });
      return { items };
    },
  );

  // ── Roadmap (DB) ──
  app.get("/public/roadmap", { config: rateLimit }, async () => {
    const items = await prisma.roadmapItem.findMany({
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
    });
    const groups: Record<"PLANNED" | "IN_PROGRESS" | "COMPLETED", typeof items> = {
      PLANNED: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };
    for (const item of items) groups[item.status].push(item);
    return { groups };
  });

  // ── Changelog (DB) ──
  app.get(
    "/public/changelog",
    {
      config: rateLimit,
      schema: {
        querystring: z.object({
          limit: z.coerce.number().int().positive().max(100).default(20),
        }),
      },
    },
    async (req) => {
      const items = await prisma.changelogEntry.findMany({
        orderBy: { publishedAt: "desc" },
        take: req.query.limit,
      });
      return { items };
    },
  );

  // ── Locations (DB) ──
  app.get("/public/locations", { config: rateLimit }, async () => {
    const items = await prisma.location.findMany({
      orderBy: [{ sortIndex: "asc" }, { city: "asc" }],
    });
    return { items };
  });

  // ── Panel-derived locations (live) ──
  app.get("/public/panel-locations", { config: rateLimit }, async () => {
    try {
      const [locations, nodes] = await Promise.all([
        pteroApp.listLocations(1, 100),
        pteroApp.listNodes(1, 100),
      ]);
      const items = locations.items.map((loc) => {
        const locNodes = nodes.items.filter((n) => n.location_id === loc.id);
        const totalMem = locNodes.reduce((a, n) => a + n.memory, 0);
        const usedMem = locNodes.reduce((a, n) => a + (n.allocated_resources?.memory ?? 0), 0);
        return {
          id: loc.short,
          city: loc.short,
          country: loc.long || loc.short,
          nodes: locNodes.length,
          online: locNodes.filter((n) => !n.maintenance_mode).length,
          capacity: totalMem ? Math.round((usedMem / totalMem) * 100) : 0,
          hardware: locNodes.length ? `Ryzen cluster · ${locNodes.length} node(s)` : "Ryzen cluster",
        };
      });
      return { locations: items, nodes: nodes.items.length };
    } catch {
      return { locations: [], nodes: 0 };
    }
  });

  // ── Status (live, panel-derived) ──
  app.get("/public/status", { config: rateLimit }, async () => {
    try {
      const nodes = await pteroApp.listNodes(1, 100);
      const allUp = nodes.items.every((n) => !n.maintenance_mode);
      const maintenanceNodes = nodes.items.filter((n) => n.maintenance_mode);
      const services = [
        { name: "Panel API", status: "operational" as const },
        { name: "Dashboard", status: "operational" as const },
        {
          name: "Compute Nodes",
          status: (allUp ? "operational" : "degraded") as "operational" | "degraded",
        },
        { name: "Git Deploy", status: "operational" as const },
      ];
      return {
        overall: allUp ? "operational" : "degraded",
        services,
        nodes: nodes.items.map((n) => ({
          name: n.name,
          status: n.maintenance_mode ? "maintenance" : "operational",
        })),
        incidents: maintenanceNodes.map((n) => ({
          title: `${n.name} in maintenance`,
          status: "monitoring",
        })),
      };
    } catch {
      return {
        overall: "degraded",
        services: [{ name: "Panel API", status: "degraded" as const }],
        nodes: [],
        incidents: [{ title: "Live status is temporarily unavailable", status: "investigating" }],
      };
    }
  });
}
