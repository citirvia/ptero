import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { encryptSecret, hashPassword, sha256, verifyPassword } from "../lib/crypto.js";
import { pteroApp } from "../lib/pterodactyl/application.js";
import { invalidateClientCache } from "../lib/pterodactyl/resolve.js";
import { recordAudit } from "../lib/audit.js";
import { getPasswordPolicyError } from "../lib/password-policy.js";

const passwordBody = z
  .object({
    current: z.string().min(1).optional(),
    next: z.string().min(12).max(128).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(12).max(128).optional(),
  })
  .transform((input) => ({
    current: input.current ?? input.currentPassword ?? "",
    next: input.next ?? input.newPassword ?? "",
  }))
  .refine((input) => input.current.length > 0 && input.next.length >= 12, {
    message: "Current and new password are required.",
  });

function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "User";
  const lastName = parts.slice(1).join(" ") || "User";
  return { firstName, lastName };
}

export async function settingsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("onRequest", app.requireAuth);

  app.patch(
    "/settings/profile",
    {
      schema: {
        body: z.object({
          name: z.string().min(2).optional(),
          email: z.string().email().optional(),
          avatarUrl: z.string().url().nullish(),
        }),
      },
    },
    async (req) => {
      const currentUser = await prisma.user.findUniqueOrThrow({
        where: { id: req.user.sub },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          pteroUserId: true,
        },
      });

      const nextName = req.body.name ?? currentUser.name;
      const nextEmail = req.body.email?.toLowerCase() ?? currentUser.email;
      const nextAvatarUrl = req.body.avatarUrl ?? undefined;

      if (currentUser.pteroUserId) {
        const { firstName, lastName } = splitDisplayName(nextName);
        const panelUser = await pteroApp.getUser(currentUser.pteroUserId);
        await pteroApp.updateUser(currentUser.pteroUserId, {
          username: panelUser.username,
          email: nextEmail,
          first_name: firstName,
          last_name: lastName,
        });
      }

      const user = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: nextName,
          email: nextEmail,
          avatarUrl: nextAvatarUrl,
        },
      });
      return {
        user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      };
    },
  );

  app.patch(
    "/settings/preferences",
    { schema: { body: z.object({ theme: z.enum(["dark", "light"]).optional() }) } },
    async (req) => {
      const user = await prisma.user.update({
        where: { id: req.user.sub },
        data: { theme: req.body.theme },
      });
      return { theme: user.theme };
    },
  );

  app.post(
    "/settings/password",
    { schema: { body: passwordBody } },
    async (req, reply) => {
      const currentRefresh = req.cookies?.ptero_refresh;
      const currentHash = currentRefresh ? sha256(currentRefresh) : null;
      const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.sub } });
      const passwordError = getPasswordPolicyError(req.body.next, {
        email: user.email,
        name: user.name,
      });
      if (passwordError) {
        return reply.code(400).send({ error: "WeakPassword", message: passwordError });
      }
      if (!(await verifyPassword(req.body.current, user.passwordHash))) {
        return reply.code(400).send({ error: "WrongPassword", message: "Current password is incorrect." });
      }
      if (req.body.current === req.body.next) {
        return reply.code(400).send({
          error: "PasswordReuse",
          message: "New password must be different from the current password.",
        });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(req.body.next) },
      });
      // Invalidate other sessions but keep the current browser signed in.
      await prisma.session.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
          ...(currentHash ? { NOT: { tokenHash: currentHash } } : {}),
        },
        data: { revokedAt: new Date() },
      });
      recordAudit({ userId: user.id, actorName: user.name, action: "Changed password", type: "AUTH", ip: req.ip });
      return reply.code(204).send();
    },
  );

  // ── Per-user Pterodactyl client key (encrypted at rest) ──
  app.put(
    "/settings/panel-key",
    { schema: { body: z.object({ key: z.string().regex(/^ptlc_/, "Must be a Client API key (ptlc_…)") }) } },
    async (req, reply) => {
      await prisma.user.update({
        where: { id: req.user.sub },
        data: { pteroClientKeyEnc: encryptSecret(req.body.key) },
      });
      invalidateClientCache(req.user.sub);
      recordAudit({ userId: req.user.sub, actorName: req.user.name, action: "Linked panel API key", type: "AUTH", ip: req.ip });
      return reply.code(204).send();
    },
  );

  app.delete("/settings/panel-key", async (req, reply) => {
    await prisma.user.update({ where: { id: req.user.sub }, data: { pteroClientKeyEnc: null } });
    invalidateClientCache(req.user.sub);
    return reply.code(204).send();
  });
}
