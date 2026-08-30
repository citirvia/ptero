import type { FastifyInstance, FastifyReply } from "fastify";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { PterodactylClient } from "../../lib/pterodactyl/client.js";
import { prisma } from "../../lib/prisma.js";
import { getClientForUser } from "../../lib/pterodactyl/resolve.js";
import { pteroApp } from "../../lib/pterodactyl/application.js";
import { normalizePteroState } from "../../lib/pterodactyl/status.js";
import {
  loadUserCtx,
  appServerToClientShape,
  userOwnsServer,
  type DbUserCtx,
} from "../../lib/pterodactyl/ownership.js";
import { registerConsole } from "./console.js";
import {
  addOneMonth,
  applyCreditDelta,
  calculateMonthlyCredits,
  InsufficientCreditsError,
} from "../../lib/billing.js";
import { PromoCodeError, resolvePromoCodeDiscount } from "../../lib/promo-codes.js";
import {
  bootstrapTemplatePackage,
  normalizeVisibleServerPath,
} from "../../lib/template-packages.js";

declare module "fastify" {
  interface FastifyRequest {
    ptero: PterodactylClient;
    userCtx: DbUserCtx | null;
  }
}

const idParam = z.object({ id: z.string().min(1) });

type TemplateFileAccess = {
  restricted: boolean;
  visiblePaths: string[];
};
const DEBUG_ENV_PATH = path.resolve(process.cwd(), ".dbg", "template-bootstrap-owner.env");

function normalizeServerState<T extends { current_state: "running" | "starting" | "stopping" | "offline"; resources: { uptime: number } }>(
  resources: T,
): T {
  return {
    ...resources,
    current_state: normalizePteroState(resources.current_state, resources.resources.uptime),
  };
}

async function reportTemplateProvisionDebugEvent(
  hypothesisId: "A" | "B" | "C" | "D" | "E",
  location: string,
  msg: string,
  data: Record<string, unknown>,
) {
  let debugServerUrl = "http://127.0.0.1:7777/event";
  let sessionId = "template-bootstrap-owner";
  try {
    const envFile = readFileSync(DEBUG_ENV_PATH, "utf8");
    debugServerUrl = envFile.match(/DEBUG_SERVER_URL=(.+)/)?.[1]?.trim() || debugServerUrl;
    sessionId = envFile.match(/DEBUG_SESSION_ID=(.+)/)?.[1]?.trim() || sessionId;
  } catch {}
  await fetch(debugServerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      runId: "pre-fix",
      hypothesisId,
      location,
      msg: `[DEBUG] ${msg}`,
      data,
      ts: Date.now(),
    }),
  }).catch(() => {});
}

function normalizeFilePath(input: string) {
  const normalized = input.replace(/\\/g, "/").trim();
  const parts = normalized
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.some((part) => part === "." || part === "..")) {
    return "";
  }
  return parts.join("/");
}

function joinFilePath(root: string, name: string) {
  const base = normalizeFilePath(root);
  const child = normalizeFilePath(name);
  return normalizeFilePath(`${base}/${child}`);
}

function isVisibleTemplatePath(visiblePaths: string[], targetPath: string) {
  const normalizedTarget = normalizeFilePath(targetPath);
  if (!normalizedTarget) return true;
  return visiblePaths.some((visiblePath) =>
    visiblePath === normalizedTarget
    || visiblePath.startsWith(`${normalizedTarget}/`)
    || normalizedTarget.startsWith(`${visiblePath}/`),
  );
}

export async function serverRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);
  app.decorateRequest("ptero", null as unknown as PterodactylClient);
  app.decorateRequest("userCtx", null);
  app.addHook("preHandler", async (req) => {
    req.ptero = await getClientForUser(req.user.sub);
    req.userCtx = await loadUserCtx(req.user.sub);
  });

  async function getTemplateFileAccess(serverId: string): Promise<TemplateFileAccess> {
    const subscription = await prisma.serverSubscription.findUnique({
      where: { serverIdentifier: serverId },
      select: { templateVisiblePaths: true },
    });
    const visiblePaths = (subscription?.templateVisiblePaths ?? [])
      .map((path: string) => normalizeVisibleServerPath(path))
      .filter(Boolean);
    return {
      restricted: visiblePaths.length > 0,
      visiblePaths,
    };
  }

  function denyTemplateFileMutation(reply: FastifyReply) {
    return reply.code(403).send({
      error: "TemplateFileAccessLocked",
      message: "This template only exposes selected files in the dashboard.",
    });
  }

  // Ownership guard for every per-server route (/:id/...).
  // The regular dashboard always stays scoped to the user's own servers.
  app.addHook("preHandler", async (req, reply) => {
    const params = req.params as { id?: string };
    if (!params?.id || !req.userCtx) return;
    const ok = await userOwnsServer(req.userCtx, params.id);
    if (!ok) {
      return reply.code(403).send({
        error: "Forbidden",
        message: "You don't have access to this server.",
      });
    }
  });

  app.post(
    "/promo-codes/preview",
    {
      schema: {
        body: z.object({
          planId: z.string().min(1),
          couponCode: z.string().trim().min(3).max(32),
        }),
      },
    },
    async (req, reply) => {
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

      try {
        const resolved = await resolvePromoCodeDiscount({
          prisma,
          userId: req.user.sub,
          code: req.body.couponCode,
          baseCredits: monthlyCredits,
        });
        return {
          promo: {
            code: resolved.promo.code,
            label: resolved.promo.label,
            type: resolved.promo.type,
            amount: resolved.promo.amount,
          },
          monthlyCredits,
          discountCredits: resolved.discountCredits,
          finalCredits: resolved.finalCredits,
        };
      } catch (error) {
        if (error instanceof PromoCodeError) {
          return reply.code(error.statusCode).send({
            error: error.code,
            message: error.message,
          });
        }
        throw error;
      }
    },
  );

  app.post(
    "/provision",
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          planId: z.string().min(1),
          couponCode: z.string().trim().min(3).max(32).optional(),
          templateId: z.string().min(1).optional(),
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
      const owner = await prisma.user.findUnique({
        where: { id: req.user.sub },
      });
      // #region debug-point C:owner-lookup
      await reportTemplateProvisionDebugEvent("C", "servers/index.ts:/provision", "resolved owner for provision request", {
        requestUserId: req.user.sub,
        ownerUserId: owner?.id ?? null,
        ownerPteroUserId: owner?.pteroUserId ?? null,
        requestedTemplateId: req.body.templateId ?? null,
        requestedName: req.body.name,
      });
      // #endregion
      if (!owner || !owner.pteroUserId) {
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
              eggId: true,
              nestId: true,
              packageArchiveName: true,
              packageStorageKey: true,
              visiblePaths: true,
            },
          })
        : null;
      // #region debug-point A:selected-template
      await reportTemplateProvisionDebugEvent("A", "servers/index.ts:/provision", "resolved selected template for provision", {
        requestUserId: req.user.sub,
        templateId: selectedTemplate?.id ?? null,
        templateEggId: selectedTemplate?.eggId ?? null,
        templateNestId: selectedTemplate?.nestId ?? null,
        hasPackageArchiveName: Boolean(selectedTemplate?.packageArchiveName),
        hasPackageStorageKey: Boolean(selectedTemplate?.packageStorageKey),
        visiblePathCount: selectedTemplate?.visiblePaths.length ?? 0,
      });
      // #endregion
      if (req.body.templateId && !selectedTemplate) {
        return reply.code(404).send({
          error: "TemplateNotFound",
          message: "Selected template is not available.",
        });
      }

      const effectiveEggId = selectedTemplate?.eggId ?? req.body.eggId;
      const effectiveNestId = selectedTemplate?.nestId ?? req.body.nestId;
      const normalizedCouponCode = req.body.couponCode?.trim() || "";

      let discountCredits = 0;
      let chargedCredits = monthlyCredits;
      let appliedPromoCode: string | null = null;
      let promoRedemptionId: string | null = null;

      try {
        await prisma.$transaction(async (tx) => {
          if (normalizedCouponCode) {
            const resolved = await resolvePromoCodeDiscount({
              prisma: tx,
              userId: owner.id,
              code: normalizedCouponCode,
              baseCredits: monthlyCredits,
            });
            discountCredits = resolved.discountCredits;
            chargedCredits = resolved.finalCredits;
            appliedPromoCode = resolved.promo.code;
            const redemption = await tx.promoRedemption.create({
              data: {
                promoCodeId: resolved.promo.id,
                userId: owner.id,
                planId: plan.id,
                discountCredits,
              },
              select: { id: true },
            });
            promoRedemptionId = redemption.id;
          }
          await applyCreditDelta({
            prisma: tx,
            userId: owner.id,
            amount: -chargedCredits,
            type: "DEPLOYMENT_CHARGE",
            description: `${req.body.name} initial monthly charge${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
          });
        });
      } catch (error) {
        if (error instanceof InsufficientCreditsError) {
          return reply.code(402).send({
            error: "InsufficientCredits",
            message: "You do not have enough credits to create this server.",
            monthlyCredits: chargedCredits,
          });
        }
        if (error instanceof PromoCodeError) {
          return reply.code(error.statusCode).send({
            error: error.code,
            message: error.message,
          });
        }
        throw error;
      }

      let provisionedServer: Awaited<ReturnType<typeof pteroApp.provisionServer>> | null = null;
      try {
        provisionedServer = await pteroApp.provisionServer({
          name: req.body.name,
          userId: owner.pteroUserId,
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
        // #region debug-point C:provisioned-server
        await reportTemplateProvisionDebugEvent("C", "servers/index.ts:/provision", "pterodactyl provision returned server", {
          requestUserId: req.user.sub,
          ownerPteroUserId: owner.pteroUserId,
          pteroServerId: provisionedServer.id,
          serverIdentifier: provisionedServer.identifier,
          serverName: provisionedServer.name,
          effectiveEggId,
          effectiveNestId,
        });
        // #endregion
        const subscription = await prisma.serverSubscription.create({
          data: {
            userId: owner.id,
            serverIdentifier: provisionedServer.identifier,
            pteroServerId: provisionedServer.id,
            serverName: provisionedServer.name,
            templateId: selectedTemplate?.id ?? null,
            templateVisiblePaths: selectedTemplate?.visiblePaths ?? [],
            memoryMb: plan.ramMb,
            cpuPct: plan.cpuPct,
            diskMb: plan.diskMb,
            databases: plan.dbCount,
            backups: plan.backups,
            allocations: req.body.allocations ?? 1,
            monthlyCredits,
            originalMonthlyCredits: monthlyCredits,
            initialPromoCode: appliedPromoCode,
            initialDiscountCredits: discountCredits,
            lastChargedAt: new Date(),
            renewalAt: addOneMonth(new Date()),
          },
        });
        if (promoRedemptionId) {
          await prisma.promoRedemption.update({
            where: { id: promoRedemptionId },
            data: {
              serverSubscriptionId: subscription.id,
              serverIdentifier: provisionedServer.identifier,
            },
          });
        }
        // #region debug-point D:subscription-created
        await reportTemplateProvisionDebugEvent("D", "servers/index.ts:/provision", "created server subscription snapshot", {
          serverIdentifier: provisionedServer.identifier,
          templateId: selectedTemplate?.id ?? null,
          templateVisiblePathCount: selectedTemplate?.visiblePaths.length ?? 0,
          visiblePathsPreview: selectedTemplate?.visiblePaths.slice(0, 10) ?? [],
        });
        // #endregion
        if (selectedTemplate) {
          await prisma.customTemplate.update({
            where: { id: selectedTemplate.id },
            data: { deploys: { increment: 1 } },
          });
          if (selectedTemplate.packageStorageKey && selectedTemplate.packageArchiveName) {
            // #region debug-point A:bootstrap-dispatch
            await reportTemplateProvisionDebugEvent("A", "servers/index.ts:/provision", "dispatching template bootstrap", {
              serverIdentifier: provisionedServer.identifier,
              packageArchiveName: selectedTemplate.packageArchiveName,
              hasPackageStorageKey: Boolean(selectedTemplate.packageStorageKey),
            });
            // #endregion
            await bootstrapTemplatePackage(
              req.ptero,
              provisionedServer.identifier,
              selectedTemplate.packageArchiveName,
              selectedTemplate.packageStorageKey,
            );
          }
        }
        return reply.code(201).send({
          server: provisionedServer,
          monthlyCredits,
          chargedCredits,
          discountCredits,
          appliedPromoCode,
        });
      } catch (error) {
        if (provisionedServer) {
          await pteroApp.deleteServer(provisionedServer.id, true).catch(() => {});
          await prisma.serverSubscription.deleteMany({
            where: { serverIdentifier: provisionedServer.identifier },
          }).catch(() => {});
        }
        await prisma.$transaction(async (tx) => {
          await applyCreditDelta({
            prisma: tx,
            userId: owner.id,
            amount: chargedCredits,
            type: "REFUND",
            description: `${req.body.name} provisioning refund${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
          });
          if (promoRedemptionId) {
            await tx.promoRedemption.deleteMany({
              where: { id: promoRedemptionId },
            });
          }
        });
        throw error;
      }
    },
  );

  // ── List (per-user isolation) ──
  app.get("/", async (req) => {
    const ctx = req.userCtx;
    // A user who linked their own client key sees exactly that key's servers.
    if (ctx?.hasClientKey) {
      const { items, meta } = await req.ptero.listServers();
      const hydratedItems = await Promise.all(
        items.map(async (server) => {
          if (server.status && server.status !== "starting") return server;
          try {
            const resources = normalizeServerState(await req.ptero.resources(server.identifier));
            return { ...server, status: resources.current_state };
          } catch {
            return server;
          }
        }),
      );
      return { servers: hydratedItems, meta };
    }
    // Otherwise scope via the Application API, but keep the result limited to
    // the user's own panel ownership even if they also have dashboard admin access.
    const all = await pteroApp.allServers();
    const mine =
      all.filter((s) => ctx?.pteroUserId != null && s.user === ctx.pteroUserId);
    const hydrated = await Promise.all(
        mine.map(async (server) => {
          if (server.status && server.status !== "starting") return server;
        try {
            const resources = normalizeServerState(await req.ptero.resources(server.identifier));
            return { ...server, status: resources.current_state };
        } catch {
          return server;
        }
      }),
    );
    const servers = hydrated.map(appServerToClientShape);
    return {
      servers,
      meta: {
        total: servers.length,
        count: servers.length,
        perPage: servers.length || 1,
        currentPage: 1,
        totalPages: 1,
      },
    };
  });

  app.get("/:id", { schema: { params: idParam } }, async (req) => {
    const server = await req.ptero.getServer(req.params.id);
    if (server.status && server.status !== "starting") {
      return { server };
    }
    try {
      const resources = normalizeServerState(await req.ptero.resources(req.params.id));
      return {
        server: {
          ...server,
          status: resources.current_state,
        },
      };
    } catch {
      return { server };
    }
  });

  app.get("/:id/resources", { schema: { params: idParam } }, async (req) => ({
    resources: normalizeServerState(await req.ptero.resources(req.params.id)),
  }));

  // ── Power & command ──
  app.post(
    "/:id/power",
    {
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
      schema: {
        params: idParam,
        body: z.object({ signal: z.enum(["start", "stop", "restart", "kill"]) }),
      },
    },
    async (req, reply) => {
      await req.ptero.power(req.params.id, req.body.signal);
      return reply.code(204).send();
    },
  );

  app.post(
    "/:id/command",
    {
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
      schema: { params: idParam, body: z.object({ command: z.string().min(1) }) },
    },
    async (req, reply) => {
      await req.ptero.command(req.params.id, req.body.command);
      return reply.code(204).send();
    },
  );

  // ── Console websocket proxy ──
  registerConsole(app);

  // ── Files ──
  app.get(
    "/:id/files",
    { schema: { params: idParam, querystring: z.object({ directory: z.string().default("/") }) } },
    async (req) => {
      const access = await getTemplateFileAccess(req.params.id);
      const files = await req.ptero.listFiles(req.params.id, req.query.directory);
      // #region debug-point D:file-list
      await reportTemplateProvisionDebugEvent("D", "servers/index.ts:/files", "listed files for template-gated directory", {
        serverIdentifier: req.params.id,
        directory: req.query.directory,
        restricted: access.restricted,
        visiblePathCount: access.visiblePaths.length,
        rawFileNames: files.map((file) => file.name),
      });
      // #endregion
      return {
        files: access.restricted
          ? files.filter((file) => isVisibleTemplatePath(access.visiblePaths, joinFilePath(req.query.directory, file.name)))
          : files,
        access: { restricted: access.restricted },
      };
    },
  );
  app.get(
    "/:id/files/contents",
    { schema: { params: idParam, querystring: z.object({ file: z.string() }) } },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      // #region debug-point D:file-contents-check
      await reportTemplateProvisionDebugEvent("D", "servers/index.ts:/files/contents", "checked file visibility for contents read", {
        serverIdentifier: req.params.id,
        file: req.query.file,
        restricted: access.restricted,
        allowed: !access.restricted || isVisibleTemplatePath(access.visiblePaths, req.query.file),
      });
      // #endregion
      if (access.restricted && !isVisibleTemplatePath(access.visiblePaths, req.query.file)) {
        return denyTemplateFileMutation(reply);
      }
      return { content: await req.ptero.fileContents(req.params.id, req.query.file) };
    },
  );
  app.post(
    "/:id/files/write",
    {
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
      schema: {
        params: idParam,
        querystring: z.object({ file: z.string() }),
        body: z.object({ content: z.string() }),
      },
    },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted && !isVisibleTemplatePath(access.visiblePaths, req.query.file)) {
        return denyTemplateFileMutation(reply);
      }
      await req.ptero.writeFile(req.params.id, req.query.file, req.body.content);
      return reply.code(204).send();
    },
  );
  app.get(
    "/:id/files/download",
    { schema: { params: idParam, querystring: z.object({ file: z.string() }) } },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted && !isVisibleTemplatePath(access.visiblePaths, req.query.file)) {
        return denyTemplateFileMutation(reply);
      }
      return { url: await req.ptero.downloadFile(req.params.id, req.query.file) };
    },
  );
  app.get(
    "/:id/files/upload",
    {
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
      schema: {
        params: idParam,
        querystring: z.object({ directory: z.string().optional().default("/") }),
      },
    },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted) {
        return denyTemplateFileMutation(reply);
      }
      const url = new URL(await req.ptero.uploadUrl(req.params.id));
      const directory = req.query.directory?.trim() || "/";
      if (directory !== "/") {
        url.searchParams.set("directory", directory);
      }
      return { url: url.toString() };
    },
  );
  app.put(
    "/:id/files/rename",
    { schema: { params: idParam, body: z.object({ root: z.string(), files: z.array(z.object({ from: z.string(), to: z.string() })) }) } },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted) {
        return denyTemplateFileMutation(reply);
      }
      await req.ptero.renameFiles(req.params.id, req.body.root, req.body.files);
      return reply.code(204).send();
    },
  );
  app.post(
    "/:id/files/copy",
    { schema: { params: idParam, body: z.object({ location: z.string() }) } },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted) {
        return denyTemplateFileMutation(reply);
      }
      await req.ptero.copyFile(req.params.id, req.body.location);
      return reply.code(204).send();
    },
  );
  app.post(
    "/:id/files/compress",
    { schema: { params: idParam, body: z.object({ root: z.string(), files: z.array(z.string()) }) } },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted) {
        return denyTemplateFileMutation(reply);
      }
      return { file: await req.ptero.compressFiles(req.params.id, req.body.root, req.body.files) };
    },
  );
  app.post(
    "/:id/files/decompress",
    { schema: { params: idParam, body: z.object({ root: z.string(), file: z.string() }) } },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted) {
        return denyTemplateFileMutation(reply);
      }
      await req.ptero.decompressFile(req.params.id, req.body.root, req.body.file);
      return reply.code(204).send();
    },
  );
  app.post(
    "/:id/files/delete",
    { schema: { params: idParam, body: z.object({ root: z.string(), files: z.array(z.string()) }) } },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted) {
        return denyTemplateFileMutation(reply);
      }
      await req.ptero.deleteFiles(req.params.id, req.body.root, req.body.files);
      return reply.code(204).send();
    },
  );
  app.post(
    "/:id/files/create-folder",
    { schema: { params: idParam, body: z.object({ root: z.string(), name: z.string() }) } },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted) {
        return denyTemplateFileMutation(reply);
      }
      await req.ptero.createFolder(req.params.id, req.body.root, req.body.name);
      return reply.code(204).send();
    },
  );
  app.post(
    "/:id/files/chmod",
    {
      schema: {
        params: idParam,
        body: z.object({
          root: z.string(),
          files: z.array(z.object({ file: z.string(), mode: z.string() })),
        }),
      },
    },
    async (req, reply) => {
      const access = await getTemplateFileAccess(req.params.id);
      if (access.restricted) {
        return denyTemplateFileMutation(reply);
      }
      await req.ptero.chmodFiles(req.params.id, req.body.root, req.body.files);
      return reply.code(204).send();
    },
  );

  // ── Databases ──
  app.get("/:id/databases", { schema: { params: idParam } }, async (req) => ({
    databases: await req.ptero.listDatabases(req.params.id),
  }));
  app.post(
    "/:id/databases",
    { schema: { params: idParam, body: z.object({ database: z.string(), remote: z.string().default("%") }) } },
    async (req) => ({ database: await req.ptero.createDatabase(req.params.id, req.body.database, req.body.remote) }),
  );
  app.post(
    "/:id/databases/:db/rotate-password",
    { schema: { params: z.object({ id: z.string(), db: z.string() }) } },
    async (req) => ({ database: await req.ptero.rotateDatabasePassword(req.params.id, req.params.db) }),
  );
  app.delete(
    "/:id/databases/:db",
    { schema: { params: z.object({ id: z.string(), db: z.string() }) } },
    async (req, reply) => {
      await req.ptero.deleteDatabase(req.params.id, req.params.db);
      return reply.code(204).send();
    },
  );

  // ── Backups ──
  app.get("/:id/backups", { schema: { params: idParam } }, async (req) => {
    const { items, meta } = await req.ptero.listBackups(req.params.id);
    return { backups: items, meta };
  });
  app.post(
    "/:id/backups",
    {
      schema: {
        params: idParam,
        // Body is fully optional — the panel happily creates an unnamed
        // snapshot when none of these are supplied.
        body: z.object({ name: z.string().optional(), ignored: z.string().optional() }).optional(),
      },
    },
    async (req) => ({
      backup: await req.ptero.createBackup(req.params.id, req.body?.name, req.body?.ignored),
    }),
  );
  app.get(
    "/:id/backups/:backup/download",
    { schema: { params: z.object({ id: z.string(), backup: z.string() }) } },
    async (req) => ({ url: await req.ptero.backupDownload(req.params.id, req.params.backup) }),
  );
  app.post(
    "/:id/backups/:backup/lock",
    { schema: { params: z.object({ id: z.string(), backup: z.string() }) } },
    async (req) => ({ backup: await req.ptero.toggleBackupLock(req.params.id, req.params.backup) }),
  );
  app.post(
    "/:id/backups/:backup/restore",
    { schema: { params: z.object({ id: z.string(), backup: z.string() }), body: z.object({ truncate: z.boolean().default(false) }) } },
    async (req, reply) => {
      await req.ptero.restoreBackup(req.params.id, req.params.backup, req.body.truncate);
      return reply.code(204).send();
    },
  );
  app.delete(
    "/:id/backups/:backup",
    { schema: { params: z.object({ id: z.string(), backup: z.string() }) } },
    async (req, reply) => {
      await req.ptero.deleteBackup(req.params.id, req.params.backup);
      return reply.code(204).send();
    },
  );

  // ── Schedules ──
  app.get("/:id/schedules", { schema: { params: idParam } }, async (req) => ({
    schedules: await req.ptero.listSchedules(req.params.id),
  }));
  app.post("/:id/schedules", { schema: { params: idParam } }, async (req) => ({
    schedule: await req.ptero.createSchedule(req.params.id, req.body as Record<string, unknown>),
  }));
  app.post(
    "/:id/schedules/:schedule",
    { schema: { params: z.object({ id: z.string(), schedule: z.coerce.number() }) } },
    async (req) => ({
      schedule: await req.ptero.updateSchedule(req.params.id, req.params.schedule, req.body as Record<string, unknown>),
    }),
  );
  app.delete(
    "/:id/schedules/:schedule",
    { schema: { params: z.object({ id: z.string(), schedule: z.coerce.number() }) } },
    async (req, reply) => {
      await req.ptero.deleteSchedule(req.params.id, req.params.schedule);
      return reply.code(204).send();
    },
  );
  app.post(
    "/:id/schedules/:schedule/execute",
    { schema: { params: z.object({ id: z.string(), schedule: z.coerce.number() }) } },
    async (req, reply) => {
      await req.ptero.executeSchedule(req.params.id, req.params.schedule);
      return reply.code(204).send();
    },
  );

  const taskBody = z.object({
    action: z.string().min(1),
    payload: z.string(),
    time_offset: z.coerce.number().int().min(0),
    sequence_id: z.coerce.number().int().positive().optional(),
    continue_on_failure: z.boolean().optional(),
  });
  app.post(
    "/:id/schedules/:schedule/tasks",
    {
      schema: {
        params: z.object({ id: z.string(), schedule: z.coerce.number() }),
        body: taskBody,
      },
    },
    async (req) => ({
      task: await req.ptero.createTask(req.params.id, req.params.schedule, req.body),
    }),
  );
  app.post(
    "/:id/schedules/:schedule/tasks/:task",
    {
      schema: {
        params: z.object({
          id: z.string(),
          schedule: z.coerce.number(),
          task: z.coerce.number(),
        }),
        body: taskBody,
      },
    },
    async (req) => ({
      task: await req.ptero.updateTask(
        req.params.id,
        req.params.schedule,
        req.params.task,
        req.body,
      ),
    }),
  );
  app.delete(
    "/:id/schedules/:schedule/tasks/:task",
    {
      schema: {
        params: z.object({
          id: z.string(),
          schedule: z.coerce.number(),
          task: z.coerce.number(),
        }),
      },
    },
    async (req, reply) => {
      await req.ptero.deleteTask(
        req.params.id,
        req.params.schedule,
        req.params.task,
      );
      return reply.code(204).send();
    },
  );

  // ── Network ──
  app.get("/:id/network", { schema: { params: idParam } }, async (req) => ({
    allocations: await req.ptero.listAllocations(req.params.id),
  }));
  app.post("/:id/network", { schema: { params: idParam } }, async (req) => ({
    allocation: await req.ptero.assignAllocation(req.params.id),
  }));
  app.post(
    "/:id/network/:allocation/primary",
    { schema: { params: z.object({ id: z.string(), allocation: z.coerce.number() }) } },
    async (req) => ({ allocation: await req.ptero.setPrimaryAllocation(req.params.id, req.params.allocation) }),
  );
  app.post(
    "/:id/network/:allocation/notes",
    { schema: { params: z.object({ id: z.string(), allocation: z.coerce.number() }), body: z.object({ notes: z.string() }) } },
    async (req) => ({ allocation: await req.ptero.setAllocationNote(req.params.id, req.params.allocation, req.body.notes) }),
  );
  app.delete(
    "/:id/network/:allocation",
    { schema: { params: z.object({ id: z.string(), allocation: z.coerce.number() }) } },
    async (req, reply) => {
      await req.ptero.deleteAllocation(req.params.id, req.params.allocation);
      return reply.code(204).send();
    },
  );

  // ── Startup ──
  app.get("/:id/startup", { schema: { params: idParam } }, async (req) => await req.ptero.startup(req.params.id));
  app.get(
    "/:id/docker-images",
    { schema: { params: idParam } },
    async (req) => ({ docker_images: await req.ptero.dockerImages(req.params.id) }),
  );
  app.put(
    "/:id/startup/variable",
    { schema: { params: idParam, body: z.object({ key: z.string(), value: z.string() }) } },
    async (req) => ({ variable: await req.ptero.setVariable(req.params.id, req.body.key, req.body.value) }),
  );

  // ── Settings ──
  app.post(
    "/:id/settings/rename",
    { schema: { params: idParam, body: z.object({ name: z.string().min(1) }) } },
    async (req, reply) => {
      await req.ptero.rename(req.params.id, req.body.name);
      return reply.code(204).send();
    },
  );
  app.post("/:id/settings/reinstall", { schema: { params: idParam } }, async (req, reply) => {
    await req.ptero.reinstall(req.params.id);
    return reply.code(204).send();
  });
  app.put(
    "/:id/settings/docker-image",
    { schema: { params: idParam, body: z.object({ docker_image: z.string() }) } },
    async (req, reply) => {
      await req.ptero.setDockerImage(req.params.id, req.body.docker_image);
      return reply.code(204).send();
    },
  );
  app.delete(
    "/:id",
    {
      schema: {
        params: idParam,
        querystring: z.object({ force: z.coerce.boolean().default(false) }),
      },
    },
    async (req, reply) => {
      const server = await pteroApp.serverByIdentifier(req.params.id);
      if (!server) {
        return reply.code(404).send({
          error: "NotFound",
          message: "Server not found.",
        });
      }
      await pteroApp.deleteServer(server.id, req.query.force);
      return reply.code(204).send();
    },
  );

  // ── Activity ──
  app.get("/:id/activity", { schema: { params: idParam } }, async (req) => ({
    activity: await req.ptero.activity(req.params.id),
  }));
}
