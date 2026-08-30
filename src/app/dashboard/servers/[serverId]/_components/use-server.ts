"use client";

import { useParams } from "next/navigation";
import type { Server } from "@/lib/api/types";
import { useServer as useLiveServer, useServerResources } from "@/lib/api/hooks";
import {
  toUiServer,
  type PteroClientServer,
  type PteroResources,
} from "@/lib/api/adapters";

/** The serverId route param (empty string if missing). */
export function useServerId(): string {
  const params = useParams<{ serverId: string }>();
  return params?.serverId ?? "";
}

/**
 * Resolve the active server from the route param. Returns `null` while the
 * live query is loading / errored so callers can render skeletons or error
 * states. Once the Pterodactyl client server (and optional resources poll)
 * arrive, they are mapped into the UI `Server` shape via {@link toUiServer}.
 */
export function useServer(): Server | null {
  const id = useServerId();
  const query = useLiveServer(id);
  const resources = useServerResources(id);

  if (!query.data) return null;
  return toUiServer(
    query.data as PteroClientServer,
    resources.data as PteroResources | undefined,
  );
}

/** Exposes the raw live server query (loading/error/raw) for consumers that need it. */
export function useServerQuery() {
  const id = useServerId();
  return useLiveServer(id);
}

/** Exposes the resources query (5s polling) so pages can render live stats. */
export function useResourcesQuery() {
  const id = useServerId();
  return useServerResources(id);
}

/** Deterministic seed derived from a server id (no Math.random). */
export function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h + 3;
}
