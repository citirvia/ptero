import type { FastifyInstance } from "fastify";
import { env, hasAppKey, hasClientKey } from "../config/env.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
    panel: env.PTERO_PANEL_URL,
    integrations: {
      applicationApi: hasAppKey,
      clientApi: hasClientKey,
    },
  }));
}
