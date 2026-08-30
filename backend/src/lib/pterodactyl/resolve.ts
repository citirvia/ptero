import { prisma } from "../prisma.js";
import { decryptSecret } from "../crypto.js";
import { PterodactylClient, pteroClient } from "./client.js";

const cache = new Map<string, { client: PterodactylClient; at: number }>();
const TTL = 60_000;

/**
 * Resolve the Client-API client for a given app user. If the user has stored
 * their own encrypted Pterodactyl client key, use it (true multi-tenant);
 * otherwise fall back to the shared env key (single-tenant default).
 */
export async function getClientForUser(userId: string): Promise<PterodactylClient> {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL) return hit.client;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pteroClientKeyEnc: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("Active user context is required to resolve a Pterodactyl client.");
  }

  let client = pteroClient;
  if (user?.pteroClientKeyEnc) {
    try {
      client = new PterodactylClient(decryptSecret(user.pteroClientKeyEnc));
    } catch {
      client = pteroClient;
    }
  }
  cache.set(userId, { client, at: Date.now() });
  return client;
}

export function invalidateClientCache(userId: string): void {
  cache.delete(userId);
}
