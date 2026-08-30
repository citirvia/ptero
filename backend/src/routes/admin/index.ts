import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { pteroApp } from "../../lib/pterodactyl/application.js";
import { prisma } from "../../lib/prisma.js";
import { recordAudit } from "../../lib/audit.js";
import { issueSession } from "../auth.js";
import { resolveCountryFromIp } from "../../lib/geoip.js";
import { marketingRoutes } from "./marketing.js";
import { adminSupportRoutes } from "./support.js";
import { getPasswordPolicyError } from "../../lib/password-policy.js";
import {
  addOneMonth,
  applyCreditDelta,
  calculateMonthlyCredits,
  InsufficientCreditsError,
} from "../../lib/billing.js";
import { runBillingCycleNow } from "../../lib/billing-processor.js";

const pageQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(50),
});

const adminUserCreateBody = z.object({
  email: z.string().email(),
  username: z.string().trim().min(3).max(32),
  first_name: z.string().trim().min(1).max(64),
  last_name: z.string().trim().min(1).max(64),
  password: z.string().min(12).max(128).optional(),
  root_admin: z.boolean().optional(),
});

const adminUserPatchBody = z
  .object({
    email: z.string().email().optional(),
    username: z.string().trim().min(3).max(32).optional(),
    first_name: z.string().trim().min(1).max(64).optional(),
    last_name: z.string().trim().min(1).max(64).optional(),
    password: z.string().min(12).max(128).optional(),
    root_admin: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided.",
  });

async function findLinkedAppUser(panelUser: { id: number; email: string }) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { pteroUserId: panelUser.id },
        { email: panelUser.email.toLowerCase() },
      ],
    },
    include: {
      sessions: {
        where: { revokedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

function isOwnerRole(role: string) {
  return role === "OWNER";
}

function isPrivilegedTarget(input: { root_admin?: boolean; linkedRole?: string | null }) {
  return !!input.root_admin || input.linkedRole === "OWNER" || input.linkedRole === "ADMIN";
}

export async function adminRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAdmin);

  // ── Aggregate platform stats ──
  app.get("/stats", async () => {
    const [users, servers, nodes, locations] = await Promise.all([
      pteroApp.listUsers(1, 1),
      pteroApp.listServers(1, 1),
      pteroApp.listNodes(1, 100),
      pteroApp.listLocations(1, 100),
    ]);
    const totalMemory = nodes.items.reduce((a, n) => a + n.memory, 0);
    const usedMemory = nodes.items.reduce((a, n) => a + (n.allocated_resources?.memory ?? 0), 0);
    return {
      users: users.meta.total,
      servers: servers.meta.total,
      nodes: nodes.meta.total,
      locations: locations.meta.total,
      capacity: { totalMemoryMb: totalMemory, usedMemoryMb: usedMemory },
    };
  });

  app.get("/settings/signup-bonus", async () => {
    const config = await prisma.appConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
      select: { signupBonusCredits: true },
    });
    return config;
  });

  app.patch(
    "/settings/signup-bonus",
    {
      schema: {
        body: z.object({
          signupBonusCredits: z.coerce.number().int().min(0).max(100_000),
        }),
      },
    },
    async (req, reply) => {
      if (!isOwnerRole(req.user.role)) {
        return reply.code(403).send({
          error: "OwnerRequired",
          message: "Only owners can update the signup bonus.",
        });
      }

      const config = await prisma.appConfig.upsert({
        where: { id: 1 },
        update: { signupBonusCredits: req.body.signupBonusCredits },
        create: { id: 1, signupBonusCredits: req.body.signupBonusCredits },
      });

      recordAudit({
        userId: req.user.sub,
        actorName: req.user.name,
        action: "Updated signup bonus",
        target: `${config.signupBonusCredits} coins`,
        type: "BILLING",
        ip: req.ip,
      });

      return { signupBonusCredits: config.signupBonusCredits };
    },
  );

  // ── Users ──
  app.get("/users", { schema: { querystring: pageQuery } }, async (req) => {
    const { items, meta } = await pteroApp.listUsers(req.query.page, req.query.per_page);
    const enriched = await Promise.all(
      items.map(async (panelUser) => {
        const [servers, linkedAppUser] = await Promise.all([
          pteroApp.listServersByUser(panelUser.id),
          findLinkedAppUser(panelUser),
        ]);
        const country = await resolveCountryFromIp(linkedAppUser?.sessions[0]?.ip ?? null);
        return {
          ...panelUser,
          server_count: servers.length,
          status: linkedAppUser?.status === "SUSPENDED" ? "suspended" : linkedAppUser ? "active" : "pending",
          credit_balance: linkedAppUser?.creditBalance ?? 0,
          country: country.country,
          country_code: country.code,
          flag: country.flag,
          linked_app_user_id: linkedAppUser?.id ?? null,
          linked_app_user_name: linkedAppUser?.name ?? null,
          linked_app_user_email: linkedAppUser?.email ?? null,
          linked_app_user_avatar_url: linkedAppUser?.avatarUrl ?? null,
          last_ip: linkedAppUser?.sessions[0]?.ip ?? null,
        };
      }),
    );
    return { users: enriched, meta };
  });
  app.get("/users/:id", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req) => {
    const panelUser = await pteroApp.getUser(req.params.id);
    const [servers, linkedAppUser] = await Promise.all([
      pteroApp.listServersByUser(panelUser.id),
      findLinkedAppUser(panelUser),
    ]);
    const country = await resolveCountryFromIp(linkedAppUser?.sessions[0]?.ip ?? null);
    return {
      user: panelUser,
      linkedAppUser: linkedAppUser
        ? {
            id: linkedAppUser.id,
            name: linkedAppUser.name,
            email: linkedAppUser.email,
            role: linkedAppUser.role,
            status: linkedAppUser.status,
            avatarUrl: linkedAppUser.avatarUrl,
            creditBalance: linkedAppUser.creditBalance,
            pteroUserId: linkedAppUser.pteroUserId,
            createdAt: linkedAppUser.createdAt,
            updatedAt: linkedAppUser.updatedAt,
          }
        : null,
      summary: {
        serverCount: servers.length,
        country: country.country,
        countryCode: country.code,
        flag: country.flag,
        lastIp: linkedAppUser?.sessions[0]?.ip ?? null,
      },
    };
  });
  app.post(
    "/users",
    {
      schema: {
        body: adminUserCreateBody,
      },
    },
    async (req, reply) => {
      if (req.body.root_admin && !isOwnerRole(req.user.role)) {
        return reply.code(403).send({
          error: "OwnerRequired",
          message: "Only owners can create privileged panel users.",
        });
      }
      if (req.body.password) {
        const passwordError = getPasswordPolicyError(req.body.password, {
          email: req.body.email,
          username: req.body.username,
          name: `${req.body.first_name} ${req.body.last_name}`,
        });
        if (passwordError) {
          return reply.code(400).send({ error: "WeakPassword", message: passwordError });
        }
      }
      return { user: await pteroApp.createUser(req.body) };
    },
  );
  app.patch(
    "/users/:id",
    {
      schema: {
        params: z.object({ id: z.coerce.number() }),
        body: adminUserPatchBody,
      },
    },
    async (req, reply) => {
      const panelUser = await pteroApp.getUser(req.params.id);
      const linked = await findLinkedAppUser(panelUser);
      const targetIsPrivileged = isPrivilegedTarget({
        root_admin: panelUser.root_admin,
        linkedRole: linked?.role ?? null,
      });

      if (
        !isOwnerRole(req.user.role) &&
        (targetIsPrivileged || req.body.root_admin !== undefined)
      ) {
        return reply.code(403).send({
          error: "OwnerRequired",
          message: "Only owners can modify privileged accounts or root admin access.",
        });
      }
      if (req.body.password) {
        const passwordError = getPasswordPolicyError(req.body.password, {
          email: req.body.email ?? panelUser.email,
          username: req.body.username ?? panelUser.username,
          name: `${req.body.first_name ?? panelUser.first_name} ${req.body.last_name ?? panelUser.last_name}`,
        });
        if (passwordError) {
          return reply.code(400).send({ error: "WeakPassword", message: passwordError });
        }
      }

      const panelUpdateBody = {
        email: req.body.email ?? panelUser.email,
        username: req.body.username ?? panelUser.username,
        first_name: req.body.first_name ?? panelUser.first_name,
        last_name: req.body.last_name ?? panelUser.last_name,
        ...(req.body.password ? { password: req.body.password } : {}),
        ...(req.body.root_admin !== undefined ? { root_admin: req.body.root_admin } : {}),
      };
      const user = await pteroApp.updateUser(req.params.id, panelUpdateBody);

      if (linked && req.body.root_admin !== undefined) {
        const nextRole =
          req.body.root_admin
            ? "ADMIN"
            : linked.role === "ADMIN"
              ? "VIEWER"
              : linked.role;

        if (nextRole !== linked.role) {
          await prisma.user.update({
            where: { id: linked.id },
            data: { role: nextRole },
          });
        }
      }

      return {
        user,
      };
    },
  );
  app.post(
    "/users/:id/impersonate",
    { schema: { params: z.object({ id: z.coerce.number() }) } },
    async (req, reply) => {
      const panelUser = await pteroApp.getUser(req.params.id);
      const linked = await findLinkedAppUser(panelUser);
      if (
        !isOwnerRole(req.user.role) &&
        isPrivilegedTarget({ root_admin: panelUser.root_admin, linkedRole: linked?.role ?? null })
      ) {
        return reply.code(403).send({
          error: "OwnerRequired",
          message: "Only owners can impersonate privileged accounts.",
        });
      }
      if (!linked) {
        return reply.code(404).send({
          error: "LinkedAppUserNotFound",
          message: "This panel user is not linked to an app account.",
        });
      }
      if (linked.status !== "ACTIVE") {
        return reply.code(400).send({
          error: "UserUnavailable",
          message: "Only active app accounts can be impersonated.",
        });
      }
      await issueSession(
        reply,
        { id: linked.id, email: linked.email, name: linked.name, role: linked.role },
        { ip: req.ip, userAgent: req.headers["user-agent"] },
      );
      recordAudit({
        userId: req.user.sub,
        actorName: req.user.name,
        action: "Impersonated user",
        target: `${linked.name} (${linked.email})`,
        type: "ADMIN",
        ip: req.ip,
        metadata: { impersonatedUserId: linked.id, panelUserId: panelUser.id },
      });
      return { ok: true, user: { id: linked.id, email: linked.email, name: linked.name } };
    },
  );
  app.patch(
    "/users/:id/status",
    {
      schema: {
        params: z.object({ id: z.coerce.number() }),
        body: z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }),
      },
    },
    async (req, reply) => {
      const panelUser = await pteroApp.getUser(req.params.id);
      const linked = await findLinkedAppUser(panelUser);
      if (
        !isOwnerRole(req.user.role) &&
        isPrivilegedTarget({ root_admin: panelUser.root_admin, linkedRole: linked?.role ?? null })
      ) {
        return reply.code(403).send({
          error: "OwnerRequired",
          message: "Only owners can suspend or reactivate privileged accounts.",
        });
      }
      if (!linked) {
        return reply.code(404).send({
          error: "LinkedAppUserNotFound",
          message: "This panel user is not linked to an app account.",
        });
      }
      const updated = await prisma.user.update({
        where: { id: linked.id },
        data: { status: req.body.status },
      });
      if (req.body.status === "SUSPENDED") {
        await prisma.session.updateMany({
          where: { userId: linked.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      recordAudit({
        userId: req.user.sub,
        actorName: req.user.name,
        action: req.body.status === "SUSPENDED" ? "Suspended user" : "Reactivated user",
        target: `${updated.name} (${updated.email})`,
        type: "ADMIN",
        ip: req.ip,
        metadata: { panelUserId: panelUser.id, appUserId: updated.id },
      });
      return { user: updated };
    },
  );
  app.delete("/users/:id", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req, reply) => {
    const panelUser = await pteroApp.getUser(req.params.id);
    const linked = await findLinkedAppUser(panelUser);
    if (
      !isOwnerRole(req.user.role) &&
      isPrivilegedTarget({ root_admin: panelUser.root_admin, linkedRole: linked?.role ?? null })
    ) {
      return reply.code(403).send({
        error: "OwnerRequired",
        message: "Only owners can delete privileged accounts.",
      });
    }
    await pteroApp.deleteUser(req.params.id);
    if (linked) {
      await prisma.user.delete({ where: { id: linked.id } }).catch(() => {});
    }
    recordAudit({
      userId: req.user.sub,
      actorName: req.user.name,
      action: "Deleted user account",
      target: `${panelUser.email}`,
      type: "ADMIN",
      ip: req.ip,
      metadata: { panelUserId: panelUser.id, linkedAppUserId: linked?.id ?? null },
    });
    return reply.code(204).send();
  });
  app.post(
    "/users/:id/credits",
    {
      schema: {
        params: z.object({ id: z.coerce.number() }),
        body: z.object({
          amount: z.coerce.number().int().refine((value) => value !== 0, "Amount must not be zero."),
          description: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      const panelUser = await pteroApp.getUser(req.params.id);
      const linked = await findLinkedAppUser(panelUser);
      if (
        !isOwnerRole(req.user.role) &&
        isPrivilegedTarget({ root_admin: panelUser.root_admin, linkedRole: linked?.role ?? null })
      ) {
        return reply.code(403).send({
          error: "OwnerRequired",
          message: "Only owners can adjust credits for privileged accounts.",
        });
      }
      if (!linked) {
        return reply.code(404).send({
          error: "LinkedAppUserNotFound",
          message: "This panel user is not linked to an app account.",
        });
      }

      const balance = await prisma.$transaction(async (tx) =>
        applyCreditDelta({
          prisma: tx,
          userId: linked.id,
          amount: req.body.amount,
          type: "MANUAL_ADJUSTMENT",
          description: req.body.description ?? "Manual credit adjustment",
        }),
      );

      recordAudit({
        userId: req.user.sub,
        actorName: req.user.name,
        action: "Adjusted user credits",
        target: `${linked.name} (${linked.email})`,
        type: "BILLING",
        ip: req.ip,
        metadata: { amount: req.body.amount, balanceAfter: balance, panelUserId: panelUser.id },
      });

      return reply.code(200).send({ ok: true, balance });
    },
  );

  // ── Nodes ──
  app.get("/nodes", { schema: { querystring: pageQuery } }, async (req) => {
    const { items, meta } = await pteroApp.listNodes(req.query.page, req.query.per_page);
    return { nodes: items, meta };
  });
  app.get("/nodes/:id", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req) => ({
    node: await pteroApp.getNode(req.params.id),
  }));
  app.get("/nodes/:id/allocations", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req) => {
    const { items, meta } = await pteroApp.nodeAllocations(req.params.id);
    return { allocations: items, meta };
  });
  app.get("/nodes/:id/configuration", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req) => ({
    configuration: await pteroApp.nodeConfiguration(req.params.id),
  }));
  const nodeBody = z.object({
    name: z.string().min(1),
    location_id: z.coerce.number().int().positive(),
    fqdn: z.string().min(1),
    scheme: z.enum(["http", "https"]),
    memory: z.coerce.number().int().min(0),
    memory_overallocate: z.coerce.number().int(),
    disk: z.coerce.number().int().min(0),
    disk_overallocate: z.coerce.number().int(),
    upload_size: z.coerce.number().int().min(1),
    daemon_listen: z.coerce.number().int().min(1),
    daemon_sftp: z.coerce.number().int().min(1),
  });
  app.post("/nodes", { schema: { body: nodeBody } }, async (req, reply) => {
    const node = await pteroApp.createNode(req.body);
    return reply.code(201).send({ node });
  });
  app.patch(
    "/nodes/:id",
    {
      schema: {
        params: z.object({ id: z.coerce.number() }),
        body: nodeBody.partial(),
      },
    },
    async (req) => ({ node: await pteroApp.updateNode(req.params.id, req.body) }),
  );
  app.delete(
    "/nodes/:id",
    { schema: { params: z.object({ id: z.coerce.number() }) } },
    async (req, reply) => {
      await pteroApp.deleteNode(req.params.id);
      return reply.code(204).send();
    },
  );

  // ── Locations ──
  app.get("/locations", { schema: { querystring: pageQuery } }, async (req) => {
    const { items, meta } = await pteroApp.listLocations(req.query.page, req.query.per_page);
    return { locations: items, meta };
  });

  // ── Servers ──
  app.get("/servers", { schema: { querystring: pageQuery } }, async (req) => {
    const { items, meta } = await pteroApp.listServers(req.query.page, req.query.per_page);
    const ownerIds = [...new Set(items.map((server) => server.user))];
    const owners = await Promise.all(
      ownerIds.map(async (ownerId) => {
        const panelUser = await pteroApp.getUser(ownerId);
        const linkedAppUser = await findLinkedAppUser(panelUser);
        return [
          ownerId,
          {
            panel: panelUser,
            linked: linkedAppUser,
          },
        ] as const;
      }),
    );
    const ownerMap = new Map(owners);
    const enriched = items.map((server) => {
      const owner = ownerMap.get(server.user);
      return {
        ...server,
        owner_name:
          owner?.linked?.name ??
          `${owner?.panel.first_name ?? ""} ${owner?.panel.last_name ?? ""}`.trim() ??
          owner?.panel.username ??
          null,
        owner_email: owner?.linked?.email ?? owner?.panel.email ?? null,
        owner_avatar_url: owner?.linked?.avatarUrl ?? null,
        owner_app_user_id: owner?.linked?.id ?? null,
      };
    });
    return { servers: enriched, meta };
  });
  app.get("/servers/:id", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req) => ({
    server: await pteroApp.getServer(req.params.id),
  }));
  app.post("/servers", async (req) => ({ server: await pteroApp.createServer(req.body as Record<string, unknown>) }));

  // High-level provision from the deploy wizard's simple inputs.
  app.post(
    "/servers/provision",
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          planId: z.string().min(1),
          templateId: z.string().min(1).optional(),
          userId: z.coerce.number(),
          nestId: z.coerce.number(),
          eggId: z.coerce.number(),
          nodeId: z.coerce.number(),
          allocations: z.coerce.number().int().min(0).optional(),
          dockerImage: z.string().optional(),
          startup: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      const owner =
        await prisma.user.findFirst({
          where: {
            OR: [
              { pteroUserId: req.body.userId },
              { id: req.user.sub },
            ],
          },
        });

      if (!owner || owner.pteroUserId !== req.body.userId) {
        return reply.code(404).send({
          error: "BillingOwnerNotFound",
          message: "Linked app user for this panel account was not found.",
        });
      }

      const plan = await prisma.plan.findUnique({
        where: { id: req.body.planId },
      });
      if (!plan || !plan.published) {
        return reply.code(404).send({
          error: "PlanNotFound",
          message: "Selected plan is not available.",
        });
      }

      const monthlyCredits = plan.creditCost > 0
        ? plan.creditCost
        : calculateMonthlyCredits({
            memoryMb: plan.ramMb,
            cpuPct: plan.cpuPct,
            diskMb: plan.diskMb,
            databases: plan.dbCount,
            backups: plan.backups,
          });

      const selectedTemplate = req.body.templateId
        ? await prisma.customTemplate.findFirst({
            where: {
              id: req.body.templateId,
              published: true,
              eggId: { not: null },
              nestId: { not: null },
            },
            select: {
              id: true,
              name: true,
              eggId: true,
              nestId: true,
            },
          })
        : null;
      if (req.body.templateId && !selectedTemplate) {
        return reply.code(404).send({
          error: "TemplateNotFound",
          message: "Selected template is not available.",
        });
      }
      const effectiveEggId = selectedTemplate?.eggId ?? req.body.eggId;
      const effectiveNestId = selectedTemplate?.nestId ?? req.body.nestId;

      try {
        await prisma.$transaction(async (tx) => {
          await applyCreditDelta({
            prisma: tx,
            userId: owner.id,
            amount: -monthlyCredits,
            type: "DEPLOYMENT_CHARGE",
            description: `${req.body.name} initial monthly charge`,
          });
        });
      } catch (error) {
        if (error instanceof InsufficientCreditsError) {
          return reply.code(402).send({
            error: "InsufficientCredits",
            message: "Bu sunucuyu olusturmak icin yeterli krediniz yok.",
            monthlyCredits,
          });
        }
        throw error;
      }

      let provisionedServer: Awaited<ReturnType<typeof pteroApp.provisionServer>> | null = null;
      try {
        provisionedServer = await pteroApp.provisionServer({
          name: req.body.name,
          userId: req.body.userId,
          nestId: effectiveNestId,
          eggId: effectiveEggId,
          nodeId: req.body.nodeId,
          memory: plan.ramMb,
          disk: plan.diskMb,
          cpu: plan.cpuPct,
          databases: plan.dbCount,
          backups: plan.backups,
          allocations: req.body.allocations,
          dockerImage: req.body.dockerImage,
          startup: req.body.startup,
        });
        await prisma.serverSubscription.create({
          data: {
            userId: owner.id,
            serverIdentifier: provisionedServer.identifier,
            pteroServerId: provisionedServer.id,
            serverName: provisionedServer.name,
            memoryMb: plan.ramMb,
            cpuPct: plan.cpuPct,
            diskMb: plan.diskMb,
            databases: plan.dbCount,
            backups: plan.backups,
            allocations: req.body.allocations ?? 1,
            monthlyCredits,
            lastChargedAt: new Date(),
            renewalAt: addOneMonth(new Date()),
          },
        });
        if (selectedTemplate) {
          await prisma.customTemplate.update({
            where: { id: selectedTemplate.id },
            data: { deploys: { increment: 1 } },
          });
        }
        // Audit row is emitted by the global audit plugin (POST /api/admin/servers/provision).
        return reply.code(201).send({ server: provisionedServer, monthlyCredits });
      } catch (error) {
        if (provisionedServer) {
          await pteroApp.deleteServer(provisionedServer.id, true).catch(() => {});
        }
        await prisma.$transaction(async (tx) => {
          await applyCreditDelta({
            prisma: tx,
            userId: owner.id,
            amount: monthlyCredits,
            type: "REFUND",
            description: `${req.body.name} provisioning refund`,
          });
        });
        throw error;
      }
    },
  );
  app.post("/billing/run", async (_req, reply) => {
    await runBillingCycleNow(app);
    return reply.code(200).send({ ok: true });
  });
  app.post("/servers/:id/suspend", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req, reply) => {
    await pteroApp.suspendServer(req.params.id);
    return reply.code(204).send();
  });
  app.post("/servers/:id/unsuspend", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req, reply) => {
    await pteroApp.unsuspendServer(req.params.id);
    return reply.code(204).send();
  });
  app.post("/servers/:id/reinstall", { schema: { params: z.object({ id: z.coerce.number() }) } }, async (req, reply) => {
    await pteroApp.reinstallServer(req.params.id);
    return reply.code(204).send();
  });
  app.delete(
    "/servers/:id",
    { schema: { params: z.object({ id: z.coerce.number() }), querystring: z.object({ force: z.coerce.boolean().default(false) }) } },
    async (req, reply) => {
      await pteroApp.deleteServer(req.params.id, req.query.force);
      return reply.code(204).send();
    },
  );

  // App-level server updates (details/build/startup).
  const detailsBody = z.object({
    name: z.string().min(1).optional(),
    user: z.coerce.number().int().positive().optional(),
    external_id: z.string().nullable().optional(),
    description: z.string().optional(),
  });
  app.patch(
    "/servers/:id/details",
    { schema: { params: z.object({ id: z.coerce.number() }), body: detailsBody } },
    async (req) => ({ server: await pteroApp.updateServerDetails(req.params.id, req.body) }),
  );

  const buildBody = z.object({
    allocation: z.coerce.number().int().positive().optional(),
    memory: z.coerce.number().int().min(0).optional(),
    swap: z.coerce.number().int().optional(),
    io: z.coerce.number().int().min(10).max(1000).optional(),
    cpu: z.coerce.number().int().min(0).optional(),
    disk: z.coerce.number().int().min(0).optional(),
    feature_limits: z
      .object({
        databases: z.coerce.number().int().min(0).optional(),
        allocations: z.coerce.number().int().min(0).optional(),
        backups: z.coerce.number().int().min(0).optional(),
      })
      .optional(),
  });
  app.patch(
    "/servers/:id/build",
    { schema: { params: z.object({ id: z.coerce.number() }), body: buildBody } },
    async (req) => ({ server: await pteroApp.updateServerBuild(req.params.id, req.body) }),
  );

  const startupBody = z.object({
    startup: z.string().optional(),
    environment: z.record(z.string(), z.string()).optional(),
    egg: z.coerce.number().int().positive().optional(),
    image: z.string().optional(),
    skip_scripts: z.boolean().optional(),
  });
  app.patch(
    "/servers/:id/startup",
    { schema: { params: z.object({ id: z.coerce.number() }), body: startupBody } },
    async (req) => ({ server: await pteroApp.updateServerStartup(req.params.id, req.body) }),
  );

  // ── Database hosts ──
  app.get("/database-hosts", { schema: { querystring: pageQuery } }, async (req) => {
    const { items, meta } = await pteroApp.listDatabaseHosts(req.query.page, req.query.per_page);
    return { hosts: items, meta };
  });
  app.post("/database-hosts", async (req, reply) => {
    const host = await pteroApp.createDatabaseHost(req.body as Record<string, unknown>);
    return reply.code(201).send({ host });
  });
  app.patch(
    "/database-hosts/:id",
    { schema: { params: z.object({ id: z.coerce.number() }) } },
    async (req) => ({
      host: await pteroApp.updateDatabaseHost(req.params.id, req.body as Record<string, unknown>),
    }),
  );
  app.delete(
    "/database-hosts/:id",
    { schema: { params: z.object({ id: z.coerce.number() }) } },
    async (req, reply) => {
      await pteroApp.deleteDatabaseHost(req.params.id);
      return reply.code(204).send();
    },
  );

  // ── Nests & eggs ──
  app.get("/nests", async () => {
    const { items, meta } = await pteroApp.listNests();
    return { nests: items, meta };
  });
  app.get("/nests/:nest/eggs", { schema: { params: z.object({ nest: z.coerce.number() }) } }, async (req) => ({
    eggs: await pteroApp.listEggs(req.params.nest),
  }));
  app.get(
    "/nests/:nest/eggs/:egg",
    { schema: { params: z.object({ nest: z.coerce.number(), egg: z.coerce.number() }) } },
    async (req) => ({ egg: await pteroApp.getEgg(req.params.nest, req.params.egg) }),
  );

  // Flattened egg catalog + deploy metadata (for the create-server wizard).
  app.get("/eggs", async () => ({ eggs: await pteroApp.allEggs() }));
  app.get("/deploy-metadata", async () => {
    const [nodes, nests, eggs, locations] = await Promise.all([
      pteroApp.listNodes(1, 100),
      pteroApp.listNests(),
      pteroApp.allEggs(),
      pteroApp.listLocations(1, 100),
    ]);
    return { nodes: nodes.items, nests: nests.items, eggs, locations: locations.items };
  });

  // ── Marketing CMS (plans, incidents, roadmap, changelog, locations) ──
  // Mount the marketing CMS under /cms — its `locations` collides with the
  // Pterodactyl Application API's panel-locations endpoint otherwise.
  await app.register(marketingRoutes, { prefix: "/cms" });
  await app.register(adminSupportRoutes, { prefix: "/support" });
}
