import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { corsOrigins, env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import {
  hashPassword,
  verifyPassword,
  randomToken,
  sha256,
} from "../lib/crypto.js";
import { getPasswordPolicyError } from "../lib/password-policy.js";
import { pteroApp } from "../lib/pterodactyl/application.js";
import { grantSignupBonusIfEligible } from "../lib/billing.js";
import type { SessionRole, SessionUser } from "../plugins/auth.js";

const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const ACCESS_TTL = "15m";
const DISCORD_STATE_COOKIE = "ptero_discord_state";
const DISCORD_STATE_TTL_SECONDS = 60 * 10;

function cookieOptions(path: string, maxAge: number) {
  const secure = env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    sameSite: "strict" as const,
    secure,
    path,
    maxAge,
  };
}

function laxCookieOptions(path: string, maxAge: number) {
  const secure = env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path,
    maxAge,
  };
}

function sessionUser(u: { id: string; email: string; name: string; role: SessionRole }): SessionUser {
  return { sub: u.id, email: u.email, name: u.name, role: u.role };
}

function authUserPayload(user: {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  status?: string;
  avatarUrl?: string | null;
  theme?: string | null;
  twoFactorEnabled?: boolean | null;
  pteroUserId?: number | null;
  pteroClientKeyEnc?: string | null;
  creditBalance?: number | null;
}) {
  return {
    ...sessionUser(user),
    status: user.status,
    avatarUrl: user.avatarUrl ?? null,
    theme: user.theme ?? undefined,
    twoFactorEnabled: !!user.twoFactorEnabled,
    pteroUserId: user.pteroUserId ?? null,
    hasPanelKey: !!user.pteroClientKeyEnc,
    creditBalance: user.creditBalance ?? 0,
  };
}

function primaryAppOrigin() {
  return corsOrigins[0] ?? "http://localhost:3000";
}

function frontendRedirect(path: string) {
  return new URL(path, primaryAppOrigin()).toString();
}

function buildDiscordAvatarUrl(discordId: string, avatar: string | null | undefined) {
  if (!avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${ext}?size=256`;
}

function ensureDiscordConfigured() {
  return !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.DISCORD_REDIRECT_URI);
}

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordProfile = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
  verified?: boolean;
};

async function exchangeDiscordCode(code: string): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID!,
    client_secret: env.DISCORD_CLIENT_SECRET!,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI!,
  });

  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error("Discord token exchange failed.");
  }

  return (await res.json()) as DiscordTokenResponse;
}

async function fetchDiscordProfile(accessToken: string): Promise<DiscordProfile> {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Could not load Discord profile.");
  }
  return (await res.json()) as DiscordProfile;
}

async function ensurePanelUserForOauth(user: {
  id: string;
  email: string;
  name: string;
  pteroUserId: number | null;
}) {
  if (user.pteroUserId) return user.pteroUserId;

  const generatedPassword = randomToken(24);
  const [first, ...rest] = user.name.trim().split(/\s+/);
  const username =
    user.email
      .toLowerCase()
      .split("@")[0]
      ?.replace(/[^a-z0-9_.-]/g, "")
      .slice(0, 30) || `user${user.id.slice(-6)}`;

  const panelUser = await pteroApp.createUser({
    email: user.email.toLowerCase(),
    username,
    first_name: first || username,
    last_name: rest.join(" ") || "User",
    password: generatedPassword,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { pteroUserId: panelUser.id },
  });

  return panelUser.id;
}

export async function issueSession(
  reply: FastifyReply,
  user: { id: string; email: string; name: string; role: SessionRole },
  meta: { ip?: string; userAgent?: string },
) {
  const accessToken = await reply.jwtSign(sessionUser(user), { expiresIn: ACCESS_TTL });
  const refresh = randomToken(48);
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refresh),
      ip: meta.ip,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  reply.setCookie("ptero_session", accessToken, cookieOptions("/", 60 * 15));
  reply.setCookie("ptero_refresh", refresh, cookieOptions("/api/auth", REFRESH_TTL_MS / 1000));
}

export async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get("/discord/start", async (_req, reply) => {
    if (!ensureDiscordConfigured()) {
      return reply.redirect(frontendRedirect("/auth/login?error=discord_unavailable"));
    }

    const state = randomToken(24);
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID!,
      response_type: "code",
      redirect_uri: env.DISCORD_REDIRECT_URI!,
      scope: "identify email",
      state,
    });

    reply.setCookie(
      DISCORD_STATE_COOKIE,
      state,
      laxCookieOptions("/api/auth/discord/callback", DISCORD_STATE_TTL_SECONDS),
    );
    return reply.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
  });

  app.get(
    "/discord/callback",
    {
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
      schema: {
        querystring: z.object({
          code: z.string().optional(),
          state: z.string().optional(),
          error: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      const finish = (path: string) => {
        reply.clearCookie(
          DISCORD_STATE_COOKIE,
          laxCookieOptions("/api/auth/discord/callback", 0),
        );
        return reply.redirect(frontendRedirect(path));
      };

      if (!ensureDiscordConfigured()) {
        return finish("/auth/login?error=discord_unavailable");
      }

      if (req.query.error) {
        return finish("/auth/login?error=discord_cancelled");
      }

      const expectedState = req.cookies?.[DISCORD_STATE_COOKIE];
      if (!req.query.code || !req.query.state || !expectedState || req.query.state !== expectedState) {
        return finish("/auth/login?error=discord_state");
      }

      try {
        const tokens = await exchangeDiscordCode(req.query.code);
        const profile = await fetchDiscordProfile(tokens.access_token);
        const email = profile.email?.trim().toLowerCase();

        if (!email || !profile.verified) {
          return finish("/auth/login?error=discord_email");
        }

        const displayName =
          profile.global_name?.trim() ||
          profile.username.trim() ||
          email.split("@")[0]!;
        const avatarUrl = buildDiscordAvatarUrl(profile.id, profile.avatar);

        let user = await prisma.user.findFirst({
          where: {
            OR: [{ discordId: profile.id }, { email }],
          },
        });

        if (!user) {
          const generatedPassword = randomToken(24);
          let pteroUserId: number | null = null;

          try {
            const [first, ...rest] = displayName.split(/\s+/);
            const username =
              email
                .split("@")[0]
                ?.replace(/[^a-z0-9_.-]/g, "")
                .slice(0, 30) || `user${profile.id.slice(-6)}`;

            const panelUser = await pteroApp.createUser({
              email,
              username,
              first_name: first || username,
              last_name: rest.join(" ") || "User",
              password: generatedPassword,
            });
            pteroUserId = panelUser.id;
          } catch (err) {
            req.log.warn({ err }, "Could not create Pterodactyl panel user during Discord OAuth registration");
          }

          user = await prisma.user.create({
            data: {
              email,
              passwordHash: await hashPassword(generatedPassword),
              discordId: profile.id,
              name: displayName,
              avatarUrl,
              role: "VIEWER",
              lastLoginAt: new Date(),
              pteroUserId,
            },
          });
          await grantSignupBonusIfEligible({ prisma, userId: user.id });
          user = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
        } else {
          if (user.status === "SUSPENDED") {
            return finish("/auth/login?error=discord_suspended");
          }

          const pteroUserId = await ensurePanelUserForOauth(user);
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              discordId: user.discordId ?? profile.id,
              avatarUrl: avatarUrl ?? user.avatarUrl,
              lastLoginAt: new Date(),
              pteroUserId,
            },
          });
        }

        req.user = sessionUser(user);
        await issueSession(reply, user, { ip: req.ip, userAgent: req.headers["user-agent"] });
        return finish("/dashboard/overview");
      } catch (err) {
        req.log.warn({ err }, "Discord OAuth callback failed");
        return finish("/auth/login?error=discord_failed");
      }
    },
  );

  // ── Register ──
  app.post(
    "/register",
    {
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
      schema: {
        body: z.object({
          name: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(12).max(128),
        }),
      },
    },
    async (req, reply) => {
      const { name, email, password } = req.body;
      const passwordError = getPasswordPolicyError(password, { email, name });
      if (passwordError) {
        return reply.code(400).send({ error: "WeakPassword", message: passwordError });
      }
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return reply.code(409).send({ error: "EmailInUse", message: "Email is already registered." });
      }
      const [count, ownerCount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "OWNER" } }),
      ]);
      if (ownerCount === 0) {
        return reply.code(503).send({
          error: "BootstrapRequired",
          message: "Initial admin provisioning is required before public registration is enabled.",
        });
      }
      const role: SessionRole = "VIEWER";

      // Mirror the account into Pterodactyl (Application API) so the user exists
      // on the panel and can own servers. Best-effort: never block signup.
      let pteroUserId: number | null = null;
      try {
        const [first, ...rest] = name.trim().split(" ");
        const username = email.toLowerCase().split("@")[0]!.replace(/[^a-z0-9_.-]/g, "").slice(0, 30) || `user${count + 1}`;
        const panelUser = await pteroApp.createUser({
          email: email.toLowerCase(),
          username,
          first_name: first || username,
          last_name: rest.join(" ") || "User",
          password,
        });
        pteroUserId = panelUser.id;
      } catch (err) {
        req.log.warn({ err }, "Could not create Pterodactyl panel user during registration");
      }

      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: await hashPassword(password),
          role,
          lastLoginAt: new Date(),
          pteroUserId,
        },
      });
      await grantSignupBonusIfEligible({ prisma, userId: user.id });
      const hydratedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      // Populate req.user so the global audit plugin records the registration.
      req.user = sessionUser(hydratedUser);
      await issueSession(reply, hydratedUser, { ip: req.ip, userAgent: req.headers["user-agent"] });
      return reply.code(201).send({ user: authUserPayload(hydratedUser) });
    },
  );

  // ── Login ──
  app.post(
    "/login",
    {
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
      schema: { body: z.object({ email: z.string().email(), password: z.string().min(1) }) },
    },
    async (req, reply) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return reply.code(401).send({ error: "InvalidCredentials", message: "Email or password is incorrect." });
      }
      if (user.status === "SUSPENDED") {
        return reply.code(403).send({ error: "AccountSuspended", message: "This account is suspended." });
      }
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      // Populate req.user so the global audit plugin records the sign-in.
      req.user = sessionUser(user);
      await issueSession(reply, user, { ip: req.ip, userAgent: req.headers["user-agent"] });
      return { user: authUserPayload(user) };
    },
  );

  // ── Refresh (rotating) ──
  // Higher rate limit because the access token expires every 15 minutes and
  // active dashboard tabs auto-refresh. Excluded from the audit log (noisy).
  app.post(
    "/refresh",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const refresh = req.cookies?.ptero_refresh;
      if (!refresh) return reply.code(401).send({ error: "NoSession", message: "No refresh token." });
      const session = await prisma.session.findUnique({ where: { tokenHash: sha256(refresh) }, include: { user: true } });
      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        reply.clearCookie("ptero_session", cookieOptions("/", 0));
        reply.clearCookie("ptero_refresh", cookieOptions("/api/auth", 0));
        return reply.code(401).send({ error: "InvalidSession", message: "Session expired — sign in again." });
      }
      if (session.user.status !== "ACTIVE") {
        await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        reply.clearCookie("ptero_session", cookieOptions("/", 0));
        reply.clearCookie("ptero_refresh", cookieOptions("/api/auth", 0));
        return reply.code(403).send({
          error: "AccountUnavailable",
          message:
            session.user.status === "SUSPENDED"
              ? "This account is suspended."
              : "This account is not active.",
        });
      }
      // Rotate: revoke the old session and mint a fresh pair.
      await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      await issueSession(reply, session.user, { ip: req.ip, userAgent: req.headers["user-agent"] });
      return { ok: true };
    },
  );

  // ── Logout ──
  app.post("/logout", async (req, reply) => {
    const refresh = req.cookies?.ptero_refresh;
    if (refresh) {
      const session = await prisma.session.findUnique({
        where: { tokenHash: sha256(refresh) },
        include: { user: true },
      });
      if (session) {
        await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        // Populate req.user so the global audit plugin records the sign-out.
        req.user = sessionUser(session.user);
      }
    }
    reply.clearCookie("ptero_session", cookieOptions("/", 0));
    reply.clearCookie("ptero_refresh", cookieOptions("/api/auth", 0));
    return { ok: true };
  });

  // ── Current user ──
  app.get("/me", { preHandler: [app.requireAuth] }, async (req, reply) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return reply.code(401).send({ error: "Unauthorized", message: "User no longer exists." });
    return {
      user: authUserPayload(user),
    };
  });
}
