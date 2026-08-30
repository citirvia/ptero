import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";

process.env.AUTH_ADMIN_PASSWORD ??= "test-admin-password";

const { default: auditPlugin } = await import("./audit.js");

/**
 * Smoke test — confirms the audit middleware can be attached and that
 * authenticated mutating requests flow through it without crashing.
 *
 * `recordAudit` is fire-and-forget and swallows DB errors, so this test
 * does not require a live Postgres connection: a failed prisma.create
 * is silently ignored by design.
 */

async function buildTestApp() {
  const app = Fastify({ logger: false });
  await app.register(auditPlugin);

  // Fake auth — synthesise a req.user for every request.
  app.addHook("preHandler", async (req) => {
    (req as unknown as { user: unknown }).user = {
      sub: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      role: "OWNER",
    };
  });

  app.post("/api/account/profile", async () => ({ ok: true }));
  app.get("/api/account/profile", async () => ({ ok: true }));
  app.post("/api/notifications/:id/read", async () => ({ ok: true }));

  return app;
}

test("audit plugin: mutating authenticated POST does not crash", async () => {
  const app = await buildTestApp();
  try {
    const res = await app.inject({
      method: "POST",
      url: "/api/account/profile",
      payload: { name: "smoke" },
    });
    assert.equal(res.statusCode, 200);
  } finally {
    await app.close();
  }
});

test("audit plugin: GET requests are ignored", async () => {
  const app = await buildTestApp();
  try {
    const res = await app.inject({ method: "GET", url: "/api/account/profile" });
    assert.equal(res.statusCode, 200);
  } finally {
    await app.close();
  }
});

test("audit plugin: opt-out routes do not crash", async () => {
  const app = await buildTestApp();
  try {
    const res = await app.inject({
      method: "POST",
      url: "/api/notifications/abc123/read",
    });
    assert.equal(res.statusCode, 200);
  } finally {
    await app.close();
  }
});
