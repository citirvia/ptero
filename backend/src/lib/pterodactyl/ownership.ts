import { prisma } from "../prisma.js";
import { pteroApp } from "./application.js";
import type { AppServer } from "./types.js";

export interface DbUserCtx {
  id: string;
  role: string;
  pteroUserId: number | null;
  hasClientKey: boolean;
}

/** Load the app-user's panel linkage + role. */
export async function loadUserCtx(userId: string): Promise<DbUserCtx | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, pteroUserId: true, pteroClientKeyEnc: true },
  });
  if (!u) return null;
  return {
    id: u.id,
    role: u.role,
    pteroUserId: u.pteroUserId,
    hasClientKey: !!u.pteroClientKeyEnc,
  };
}

/**
 * Map an Application-API server to the Client-API shape the frontend expects,
 * so list rendering works whether the source is the client or application API.
 */
export function appServerToClientShape(s: AppServer) {
  return {
    server_owner: true,
    identifier: s.identifier,
    uuid: s.uuid,
    name: s.name,
    node: `node-${s.node}`,
    description: s.description,
    status: s.status,
    is_suspended: s.suspended,
    is_installing: s.status === "installing",
    sftp_details: { ip: "", port: 0 },
    limits: s.limits,
    feature_limits: s.feature_limits,
  };
}

/**
 * Verify the given app user may access a server (by short identifier).
 * Dashboard routes stay owner-scoped, regardless of admin role.
 */
export async function userOwnsServer(
  ctx: DbUserCtx,
  identifier: string,
): Promise<boolean> {
  if (ctx.pteroUserId == null) return false;
  const owner = await pteroApp.serverOwnerByIdentifier(identifier);
  return owner === ctx.pteroUserId;
}
