import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { pteroApp } from "./pterodactyl/application.js";
import { pteroClient } from "./pterodactyl/client.js";

const INTERVAL_MS = 60_000;
const RETAIN_PER_SERVER = 120;

/**
 * Polls Pterodactyl every minute and persists per-server resource usage to
 * `UsageSnapshot`, keeping only the latest N rows per server identifier.
 *
 * Wired from `server.ts` after the HTTP listener is up. No-ops when there's
 * no shared client key (the shared key is what the recorder uses; per-user
 * recording would require a different design).
 */
export function startUsageRecorder(app: FastifyInstance): () => void {
  if (!env.PTERO_CLIENT_KEY) {
    app.log.warn(
      "Usage recorder disabled: PTERO_CLIENT_KEY is not set.",
    );
    return () => {};
  }

  let stopped = false;

  const tick = async () => {
    try {
      const servers = await pteroApp.allServers();
      for (const s of servers) {
        try {
          const r = await pteroClient.resources(s.identifier);
          await prisma.usageSnapshot.create({
            data: {
              serverIdentifier: s.identifier,
              cpu: r.resources.cpu_absolute,
              memBytes: BigInt(Math.round(r.resources.memory_bytes ?? 0)),
              diskBytes: BigInt(Math.round(r.resources.disk_bytes ?? 0)),
              rxBytes: BigInt(Math.round(r.resources.network_rx_bytes ?? 0)),
              txBytes: BigInt(Math.round(r.resources.network_tx_bytes ?? 0)),
            },
          });

          // Trim — keep the latest N per server identifier.
          const oldest = await prisma.usageSnapshot.findMany({
            where: { serverIdentifier: s.identifier },
            orderBy: { takenAt: "desc" },
            skip: RETAIN_PER_SERVER,
            select: { id: true },
          });
          if (oldest.length > 0) {
            await prisma.usageSnapshot.deleteMany({
              where: { id: { in: oldest.map((o) => o.id) } },
            });
          }
        } catch (err) {
          app.log.debug(
            { err, identifier: s.identifier },
            "usage-recorder: per-server tick failed",
          );
        }
      }
    } catch (err) {
      app.log.warn({ err }, "usage-recorder: full tick failed");
    }
  };

  const loop = async () => {
    while (!stopped) {
      await tick();
      if (stopped) break;
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  };

  app.log.info("Usage recorder started (60s interval).");
  void loop();

  return () => {
    stopped = true;
  };
}
