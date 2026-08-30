import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export type SessionRole = "OWNER" | "ADMIN" | "DEVELOPER" | "BILLING" | "VIEWER";

export interface SessionUser {
  sub: string; // user id
  email: string;
  name: string;
  role: SessionRole;
}

function clearSessionCookie(reply: FastifyReply) {
  const secure = env.NODE_ENV === "production";
  reply.clearCookie("ptero_session", {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
  });
}

function clearAuthCookies(reply: FastifyReply) {
  const secure = env.NODE_ENV === "production";
  clearSessionCookie(reply);
  reply.clearCookie("ptero_refresh", {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/api/auth",
  });
}

export function isAdminRole(role: SessionRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

function toSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
}): SessionUser {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

async function loadActiveUser(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  try {
    await req.jwtVerify();
  } catch {
    // Preserve the refresh cookie so the frontend can transparently rotate the
    // session after an expired access token instead of logging the user out.
    clearSessionCookie(reply);
    reply
      .code(401)
      .send({ error: "Unauthorized", message: "Invalid or missing session." });
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { id: true, email: true, name: true, role: true, status: true },
  });
  if (!user) {
    clearAuthCookies(reply);
    reply
      .code(401)
      .send({ error: "Unauthorized", message: "User no longer exists." });
    return true;
  }
  if (user.status !== "ACTIVE") {
    clearAuthCookies(reply);
    reply.code(403).send({
      error: "AccountUnavailable",
      message:
        user.status === "SUSPENDED"
          ? "This account is suspended."
          : "This account is not active.",
    });
    return true;
  }

  req.user = toSessionUser(user);
  return false;
}

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: SessionUser;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: SessionUser;
    user: SessionUser;
  }
}

export default fp(async (app) => {
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    cookie: { cookieName: "ptero_session", signed: false },
  });

  app.decorate("requireAuth", async (req: FastifyRequest, reply: FastifyReply) => {
    await loadActiveUser(req, reply);
  });

  app.decorate("requireAdmin", async (req: FastifyRequest, reply: FastifyReply) => {
    const handled = await loadActiveUser(req, reply);
    if (handled) return;
    if (!isAdminRole(req.user.role)) {
      return reply.code(403).send({ error: "Forbidden", message: "Admin access required." });
    }
  });
});
