import { randomUUID } from "node:crypto";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import websocket from "@fastify/websocket";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";

import { env, corsOrigins } from "./config/env.js";
import authPlugin from "./plugins/auth.js";
import auditPlugin from "./plugins/audit.js";
import prismaPlugin from "./plugins/prisma.js";
import { PteroApiError } from "./lib/pterodactyl/errors.js";

import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { accountRoutes } from "./routes/account.js";
import { serverRoutes } from "./routes/servers/index.js";
import { adminRoutes } from "./routes/admin/index.js";
import { notificationRoutes } from "./routes/notifications.js";
import { auditRoutes } from "./routes/audit-logs.js";
import { settingsRoutes } from "./routes/settings.js";
import { apiKeyRoutes } from "./routes/api-keys.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { sessionRoutes } from "./routes/sessions.js";
import { publicRoutes } from "./routes/public.js";
import { deploymentRoutes } from "./routes/deployments.js";
import { supportRoutes } from "./routes/support.js";
import { templateRoutes } from "./routes/templates.js";
import { salesLeadRoutes } from "./routes/sales-leads.js";

export async function buildApp(): Promise<FastifyInstance> {
  const trustedOrigins = new Set(corsOrigins);
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
          : undefined,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.password",
          "req.body.token",
          "*.password",
          "*.passwordHash",
        ],
        remove: false,
        censor: "[REDACTED]",
      },
    },
    trustProxy: true,
    disableRequestLogging: true,
    genReqId: (req) => (req.headers["x-request-id"] as string) ?? randomUUID(),
    requestIdHeader: "x-request-id",
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Tolerate empty bodies sent with `content-type: application/json`
  // (common on DELETE / no-body POST from fetch clients) instead of 400-ing.
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body: string, done) => {
      if (!body || (typeof body === "string" && body.trim() === "")) {
        done(null, undefined);
        return;
      }
      try {
        done(null, JSON.parse(body));
      } catch (err) {
        (err as { statusCode?: number }).statusCode = 400;
        done(err as Error, undefined);
      }
    },
  );

  // ── Core plugins ──
  await app.register(sensible);
  await app.register(helmet, {
    // The WS proxy needs to embed cross-origin resources; keep COEP off.
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", env.PTERO_PANEL_URL, "wss:", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
  });
  await app.register(cors, {
    origin: corsOrigins.length ? corsOrigins : false,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    allowList: (req) => req.url === "/health",
  });
  await app.register(websocket);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(auditPlugin);

  app.addHook("onRequest", async (req, reply) => {
    const method = req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;
    if (!req.url.startsWith("/api/")) return;
    if (req.url.startsWith("/api/webhooks")) return;

    const originHeader = req.headers.origin;
    const refererHeader = req.headers.referer;
    const candidate = originHeader ?? refererHeader;
    if (!candidate) {
      return reply.code(403).send({
        error: "OriginRequired",
        message: "State-changing requests must include a trusted Origin or Referer header.",
      });
    }

    let origin: string;
    try {
      origin = new URL(candidate).origin;
    } catch {
      return reply.code(403).send({
        error: "InvalidOrigin",
        message: "The request Origin or Referer header is invalid.",
      });
    }

    if (!trustedOrigins.has(origin)) {
      return reply.code(403).send({
        error: "OriginNotAllowed",
        message: "Cross-site state-changing requests are not allowed.",
      });
    }
  });

  // ── Error handling ──
  app.setErrorHandler((error: FastifyError, req, reply) => {
    if (error instanceof PteroApiError) {
      req.log.warn({ status: error.status, code: error.code }, error.detail);
      const status = error.status >= 400 && error.status < 600 ? error.status : 502;
      return reply.code(status).send({ error: error.code, message: error.detail });
    }
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "ValidationError",
        message: "Request validation failed",
        issues: error.issues,
      });
    }
    if (error.validation) {
      return reply.code(400).send({ error: "ValidationError", message: error.message });
    }
    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    if (status >= 500) req.log.error({ err: error }, error.message);
    return reply.code(status).send({
      error: error.code ?? "InternalError",
      message: status >= 500 ? "An unexpected error occurred." : error.message,
    });
  });

  // ── Routes ──
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(accountRoutes, { prefix: "/api" });
  await app.register(publicRoutes, { prefix: "/api" });
  await app.register(notificationRoutes, { prefix: "/api" });
  await app.register(settingsRoutes, { prefix: "/api" });
  await app.register(apiKeyRoutes, { prefix: "/api" });
  await app.register(auditRoutes, { prefix: "/api" });
  await app.register(webhookRoutes, { prefix: "/api" });
  await app.register(sessionRoutes, { prefix: "/api" });
  await app.register(deploymentRoutes, { prefix: "/api" });
  await app.register(supportRoutes, { prefix: "/api" });
  await app.register(templateRoutes, { prefix: "/api" });
  await app.register(salesLeadRoutes, { prefix: "/api" });
  await app.register(serverRoutes, { prefix: "/api/servers" });
  await app.register(adminRoutes, { prefix: "/api/admin" });

  return app;
}
