import { env } from "../../config/env.js";
import { pteroRequest, unwrap, unwrapList, type ListResult } from "./http.js";
import { PteroApiError } from "./errors.js";
import type {
  AppAllocation,
  AppEgg,
  AppLocation,
  AppNest,
  AppNode,
  AppServer,
  AppUser,
} from "./types.js";

const BASE = `${env.PTERO_PANEL_URL}/api/application`;
const SERVER_CACHE_TTL_MS = 30_000;

/** Pterodactyl Application (admin) API. Uses an Application key (ptla_…). */
export class PterodactylApplication {
  constructor(private readonly key: string | undefined = env.PTERO_APP_KEY) {}

  private serverCache: { at: number; items: AppServer[] } | null = null;

  private req<T>(path: string, opts?: Parameters<typeof pteroRequest>[3]) {
    return pteroRequest<T>(BASE, this.key, path, opts);
  }

  private list<T>(path: string, page = 1, perPage = 50, include?: string) {
    return this.req<{
      data: { attributes: T }[];
      meta?: { pagination?: Record<string, number> };
    }>(path, { query: { page, per_page: perPage, include } }).then(unwrapList);
  }

  /* ── Users ── */
  listUsers(page = 1, perPage = 50): Promise<ListResult<AppUser>> {
    return this.list<AppUser>("/users", page, perPage);
  }
  async getUser(id: number): Promise<AppUser> {
    return unwrap(await this.req<{ attributes: AppUser }>(`/users/${id}`));
  }
  async createUser(body: Record<string, unknown>): Promise<AppUser> {
    return unwrap(
      await this.req<{ attributes: AppUser }>("/users", { method: "POST", body }),
    );
  }
  async updateUser(id: number, body: Record<string, unknown>): Promise<AppUser> {
    return unwrap(
      await this.req<{ attributes: AppUser }>(`/users/${id}`, {
        method: "PATCH",
        body,
      }),
    );
  }
  async deleteUser(id: number) {
    await this.req(`/users/${id}`, { method: "DELETE" });
  }

  /* ── Nodes ── */
  listNodes(page = 1, perPage = 50): Promise<ListResult<AppNode>> {
    return this.list<AppNode>("/nodes", page, perPage);
  }
  async getNode(id: number): Promise<AppNode> {
    return unwrap(await this.req<{ attributes: AppNode }>(`/nodes/${id}`));
  }
  async nodeAllocations(id: number): Promise<ListResult<AppAllocation>> {
    return unwrapList(
      await this.req<{ data: { attributes: AppAllocation }[]; meta?: { pagination?: Record<string, number> } }>(
        `/nodes/${id}/allocations`,
        { query: { per_page: 200 } },
      ),
    );
  }
  /** Wings auto-deploy config for a node (used to provision/inspect daemons). */
  async nodeConfiguration(id: number): Promise<unknown> {
    return this.req(`/nodes/${id}/configuration`);
  }
  async createNode(body: Record<string, unknown>): Promise<AppNode> {
    return unwrap(
      await this.req<{ attributes: AppNode }>("/nodes", {
        method: "POST",
        body,
      }),
    );
  }
  async updateNode(id: number, body: Record<string, unknown>): Promise<AppNode> {
    return unwrap(
      await this.req<{ attributes: AppNode }>(`/nodes/${id}`, {
        method: "PATCH",
        body,
      }),
    );
  }
  async deleteNode(id: number) {
    await this.req(`/nodes/${id}`, { method: "DELETE" });
  }

  /* ── Locations ── */
  listLocations(page = 1, perPage = 50): Promise<ListResult<AppLocation>> {
    return this.list<AppLocation>("/locations", page, perPage);
  }

  /* ── Servers ── */
  listServers(page = 1, perPage = 50): Promise<ListResult<AppServer>> {
    return this.list<AppServer>("/servers", page, perPage);
  }
  async getServer(id: number): Promise<AppServer> {
    return unwrap(await this.req<{ attributes: AppServer }>(`/servers/${id}`));
  }

  /** Every server across the panel (paged through), used for owner filtering. */
  async allServers(forceRefresh = false): Promise<AppServer[]> {
    if (
      !forceRefresh &&
      this.serverCache &&
      Date.now() - this.serverCache.at < SERVER_CACHE_TTL_MS
    ) {
      return this.serverCache.items;
    }

    const out: AppServer[] = [];
    let page = 1;
    // Cap at 20 pages (1000 servers) as a safety bound.
    for (; page <= 20; page++) {
      const { items, meta } = await this.listServers(page, 100);
      out.push(...items);
      if (page >= meta.totalPages) break;
    }
    this.serverCache = { at: Date.now(), items: out };
    return out;
  }

  /** Servers owned by a specific panel user (by Application user id). */
  async listServersByUser(pteroUserId: number): Promise<AppServer[]> {
    const all = await this.allServers();
    return all.filter((s) => s.user === pteroUserId);
  }

  /** Resolve which panel user owns a server, by its short identifier. */
  async serverOwnerByIdentifier(identifier: string): Promise<number | null> {
    const all = await this.allServers();
    const match = all.find((s) => s.identifier === identifier);
    return match ? match.user : null;
  }
  async serverByIdentifier(identifier: string): Promise<AppServer | null> {
    const all = await this.allServers();
    return all.find((s) => s.identifier === identifier) ?? null;
  }
  async createServer(body: Record<string, unknown>): Promise<AppServer> {
    return unwrap(
      await this.req<{ attributes: AppServer }>("/servers", {
        method: "POST",
        body,
      }),
    );
  }
  async suspendServer(id: number) {
    await this.req(`/servers/${id}/suspend`, { method: "POST" });
  }
  async unsuspendServer(id: number) {
    await this.req(`/servers/${id}/unsuspend`, { method: "POST" });
  }
  async reinstallServer(id: number) {
    await this.req(`/servers/${id}/reinstall`, { method: "POST" });
  }
  async deleteServer(id: number, force = false) {
    await this.req(`/servers/${id}${force ? "/force" : ""}`, {
      method: "DELETE",
    });
  }
  async updateServerDetails(
    id: number,
    body: Record<string, unknown>,
  ): Promise<AppServer> {
    return unwrap(
      await this.req<{ attributes: AppServer }>(`/servers/${id}/details`, {
        method: "PATCH",
        body,
      }),
    );
  }
  async updateServerBuild(
    id: number,
    body: Record<string, unknown>,
  ): Promise<AppServer> {
    return unwrap(
      await this.req<{ attributes: AppServer }>(`/servers/${id}/build`, {
        method: "PATCH",
        body,
      }),
    );
  }
  async updateServerStartup(
    id: number,
    body: Record<string, unknown>,
  ): Promise<AppServer> {
    return unwrap(
      await this.req<{ attributes: AppServer }>(`/servers/${id}/startup`, {
        method: "PATCH",
        body,
      }),
    );
  }

  /* ── Database hosts ── */
  listDatabaseHosts(page = 1, perPage = 50): Promise<ListResult<unknown>> {
    return this.list<unknown>("/databases", page, perPage);
  }
  async createDatabaseHost(body: Record<string, unknown>) {
    return unwrap(
      await this.req<{ attributes: unknown }>("/databases", {
        method: "POST",
        body,
      }),
    );
  }
  async updateDatabaseHost(id: number, body: Record<string, unknown>) {
    return unwrap(
      await this.req<{ attributes: unknown }>(`/databases/${id}`, {
        method: "PATCH",
        body,
      }),
    );
  }
  async deleteDatabaseHost(id: number) {
    await this.req(`/databases/${id}`, { method: "DELETE" });
  }

  /* ── Nests & eggs ── */
  listNests(): Promise<ListResult<AppNest>> {
    return this.list<AppNest>("/nests", 1, 100);
  }
  async listEggs(nest: number): Promise<AppEgg[]> {
    const res = await this.req<{ data: { attributes: AppEgg }[] }>(
      `/nests/${nest}/eggs`,
      { query: { include: "variables" } },
    );
    return res.data.map((d) => d.attributes);
  }
  async getEgg(nest: number, egg: number): Promise<AppEgg> {
    return unwrap(
      await this.req<{ attributes: AppEgg }>(`/nests/${nest}/eggs/${egg}`, {
        query: { include: "variables" },
      }),
    );
  }

  /** Every egg across every nest — flattened, for deploy pickers. */
  async allEggs(): Promise<(AppEgg & { nest: number })[]> {
    const { items: nests } = await this.listNests();
    const groups = await Promise.all(
      nests.map(async (n) => {
        const eggs = await this.listEggs(n.id);
        return eggs.map((e) => ({ ...e, nest: n.id }));
      }),
    );
    return groups.flat();
  }

  /** Find a free (unassigned) allocation on a node. */
  async firstFreeAllocation(nodeId: number): Promise<number | null> {
    const { items } = await this.nodeAllocations(nodeId);
    const free = items.find((a) => !a.assigned);
    return free ? free.id : null;
  }

  /**
   * High-level provisioning: resolve the egg (docker image, startup, default
   * env vars), pick a free allocation on the node, and create the server with
   * a complete Pterodactyl payload from the wizard's simple inputs.
   */
  async provisionServer(input: {
    name: string;
    userId: number;
    nestId: number;
    eggId: number;
    nodeId: number;
    memory: number; // MB
    disk: number; // MB
    cpu: number; // %
    databases?: number;
    backups?: number;
    allocations?: number;
    dockerImage?: string;
    startup?: string;
  }): Promise<AppServer> {
    const egg = await this.req<{
      attributes: AppEgg & {
        relationships?: {
          variables?: { data: { attributes: { env_variable: string; default_value: string } }[] };
        };
      };
    }>(`/nests/${input.nestId}/eggs/${input.eggId}`, { query: { include: "variables" } });

    const eggAttr = egg.attributes;
    const environment: Record<string, string> = {};
    for (const v of eggAttr.relationships?.variables?.data ?? []) {
      environment[v.attributes.env_variable] = v.attributes.default_value ?? "";
    }

    const allocation = await this.firstFreeAllocation(input.nodeId);
    if (allocation === null) {
      throw new PteroApiError({
        status: 409,
        code: "NoAllocation",
        detail: `No free allocation available on node ${input.nodeId}. Add allocations in the panel first.`,
      });
    }

    return this.createServer({
      name: input.name,
      user: input.userId,
      egg: input.eggId,
      docker_image: input.dockerImage ?? eggAttr.docker_image,
      startup: input.startup ?? eggAttr.startup,
      environment,
      limits: {
        memory: input.memory,
        swap: 0,
        disk: input.disk,
        io: 500,
        cpu: input.cpu,
      },
      feature_limits: {
        databases: input.databases ?? 1,
        backups: input.backups ?? 1,
        allocations: input.allocations ?? 1,
      },
      allocation: { default: allocation },
    });
  }
}

export const pteroApp = new PterodactylApplication();
