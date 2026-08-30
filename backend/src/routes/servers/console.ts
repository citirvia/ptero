import type { FastifyInstance } from "fastify";
import { WebSocket as WsClient } from "ws";
import { env } from "../../config/env.js";
import { corsOrigins } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { getClientForUser } from "../../lib/pterodactyl/resolve.js";
import type { SessionUser } from "../../plugins/auth.js";

/**
 * Console WebSocket proxy.
 *
 *   browser  ⇄  this BFF  ⇄  Wings (node.playboi.cc)
 *
 * The browser authenticates with the httpOnly session cookie already issued by
 * the BFF. The BFF then asks the panel for short-lived Wings credentials and
 * relays the stream, silently refreshing the Wings token when it expires.
 */
export function registerConsole(app: FastifyInstance) {
  app.get(
    "/:id/console",
    { websocket: true },
    async (socket /* ws.WebSocket */, req) => {
      const { id } = req.params as { id: string };
      const origin = req.headers.origin;
      if (!origin || !corsOrigins.includes(origin)) {
        socket.close(4403, "Forbidden");
        return;
      }

      // ── Authenticate the browser ──
      const raw = req.cookies?.ptero_session;
      let user: SessionUser | null = null;
      try {
        if (raw) user = app.jwt.verify<SessionUser>(raw);
      } catch {
        user = null;
      }
      if (!user) {
        socket.close(4401, "Unauthorized");
        return;
      }
      const activeUser = await prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, status: true },
      });
      if (!activeUser || activeUser.status !== "ACTIVE") {
        socket.close(4403, "Account unavailable");
        return;
      }

      const client = await getClientForUser(user.sub);
      let upstream: WsClient | null = null;
      let closed = false;

      const closeAll = (code = 1000, reason = "closed") => {
        if (closed) return;
        closed = true;
        try {
          upstream?.close();
        } catch {}
        try {
          socket.close(code, reason);
        } catch {}
      };

      const send = (obj: unknown) => {
        if (upstream?.readyState === WsClient.OPEN) upstream.send(JSON.stringify(obj));
      };

      const connectUpstream = async () => {
        const creds = await client.websocket(id);
        const ws = new WsClient(creds.socket, {
          headers: { Origin: env.PTERO_PANEL_URL },
          rejectUnauthorized: !env.PTERO_ALLOW_INSECURE_TLS,
        });
        upstream = ws;

        ws.on("open", () => {
          ws.send(JSON.stringify({ event: "auth", args: [creds.token] }));
        });

        ws.on("message", async (data) => {
          const text = data.toString();
          // Refresh the Wings token transparently.
          try {
            const parsed = JSON.parse(text) as { event?: string };
            if (parsed.event === "token expiring" || parsed.event === "token expired") {
              const fresh = await client.websocket(id);
              ws.send(JSON.stringify({ event: "auth", args: [fresh.token] }));
            }
          } catch {
            /* not JSON — just relay */
          }
          if (socket.readyState === socket.OPEN) socket.send(text);
        });

        ws.on("close", (code) => closeAll(code || 1000, "upstream closed"));
        ws.on("error", (err) => {
          app.log.warn({ err }, "wings websocket error");
          closeAll(1011, "upstream error");
        });
      };

      // ── browser → wings ──
      socket.on("message", (data: Buffer) => {
        if (upstream?.readyState === WsClient.OPEN) {
          upstream.send(data.toString());
        }
      });
      socket.on("close", () => closeAll());
      socket.on("error", () => closeAll(1011, "client error"));

      try {
        await connectUpstream();
        // keepalive ping
        const ping = setInterval(() => send({ event: "send stats", args: [null] }), 25_000);
        socket.on("close", () => clearInterval(ping));
      } catch (err) {
        app.log.error({ err }, "failed to open console proxy");
        closeAll(1011, "failed to reach panel");
      }
    },
  );
}
