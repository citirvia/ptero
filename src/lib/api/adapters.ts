/**
 * Adapters: map live Pterodactyl / backend shapes into the prop shapes the
 * UI components consume. Keeps page code free of `attributes`-style
 * normalization and centralizes runtime-detection heuristics.
 */
import type { Server, Runtime, ServerStatus } from "@/lib/api/types";
import { pteroStateToServerStatus } from "@/lib/server-status";

/* ── Pterodactyl Client API server → UI Server ── */
export interface PteroClientServer {
  identifier: string;
  uuid: string;
  name: string;
  node: string;
  description: string;
  status: string | null;
  is_suspended: boolean;
  is_installing: boolean;
  sftp_details: { ip: string; port: number };
  limits: { memory: number; disk: number; cpu: number };
  feature_limits: { databases: number; allocations: number; backups: number };
  relationships?: {
    allocations?: { data: { attributes: { ip: string; port: number; is_default: boolean } }[] };
  };
}

export interface PteroResources {
  current_state: "running" | "starting" | "stopping" | "offline";
  is_suspended: boolean;
  resources: {
    memory_bytes: number;
    cpu_absolute: number;
    disk_bytes: number;
    network_rx_bytes: number;
    network_tx_bytes: number;
    uptime: number;
  };
}

const RUNTIME_GUESS: { re: RegExp; runtime: Runtime }[] = [
  { re: /bun/i, runtime: "bun" },
  { re: /python|py/i, runtime: "python" },
  { re: /docker|image/i, runtime: "docker" },
  { re: /node|js|discord/i, runtime: "node" },
];

function guessRuntime(s: PteroClientServer): Runtime {
  const hay = `${s.name} ${s.description}`;
  for (const g of RUNTIME_GUESS) if (g.re.test(hay)) return g.runtime;
  return "node";
}

function stateToStatus(state: string | null, installing: boolean): ServerStatus {
  return pteroStateToServerStatus(state as "running" | "starting" | "stopping" | "offline" | null, installing);
}

/** Map a client server (+ optional live resources) to the UI Server shape. */
export function toUiServer(s: PteroClientServer, res?: PteroResources): Server {
  const alloc = s.relationships?.allocations?.data?.find((a) => a.attributes.is_default)?.attributes
    ?? s.relationships?.allocations?.data?.[0]?.attributes;
  const ramUsed = res ? Math.round(res.resources.memory_bytes / 1_048_576) : 0;
  const diskUsed = res ? Math.round(res.resources.disk_bytes / 1_048_576) : 0;
  const mappedStatus = res
    ? pteroStateToServerStatus(res.current_state, s.is_installing, res.resources.uptime)
    : stateToStatus(s.status, s.is_installing);
  return {
    id: s.identifier,
    name: s.name,
    runtime: guessRuntime(s),
    runtimeVersion: "",
    status: mappedStatus,
    region: s.node,
    regionFlag: "🌐",
    node: s.node,
    cpu: res ? Math.round(res.resources.cpu_absolute) : 0,
    ram: { used: ramUsed, total: s.limits.memory },
    disk: { used: diskUsed, total: s.limits.disk },
    uptimeSeconds: res ? Math.round(res.resources.uptime / 1000) : 0,
    plan: `${s.limits.memory} MB`,
    ip: alloc?.ip ?? s.sftp_details.ip,
    port: alloc?.port ?? s.sftp_details.port,
    primaryDomain: undefined,
    createdAt: "",
  };
}

/* ── Application API node → admin node card shape ── */
export interface PteroAppNode {
  id: number;
  name: string;
  fqdn: string;
  location_id: number;
  maintenance_mode: boolean;
  memory: number;
  disk: number;
  daemon_listen: number;
  daemon_sftp: number;
  allocated_resources?: { memory: number; disk: number };
}

export function toUiNode(n: PteroAppNode) {
  const memUsed = n.allocated_resources?.memory ?? 0;
  const diskUsed = n.allocated_resources?.disk ?? 0;
  return {
    id: n.fqdn,
    name: n.name,
    region: n.fqdn,
    flag: "🌐",
    status: (n.maintenance_mode ? "maintenance" : "online") as "online" | "maintenance" | "offline",
    cpuLoad: n.memory ? Math.round((memUsed / n.memory) * 100) : 0,
    ram: { used: Math.round(memUsed / 1024), total: Math.round(n.memory / 1024) },
    disk: { used: Math.round(diskUsed / 1024), total: Math.round(n.disk / 1024) },
    servers: 0,
    uptimeDays: 0,
    hardware: `${n.fqdn} · :${n.daemon_listen}`,
  };
}

/* ── Application API user → platform user row ── */
export interface PteroAppUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  root_admin: boolean;
  created_at: string;
  server_count?: number;
  status?: "active" | "suspended" | "pending";
  country?: string;
  country_code?: string | null;
  flag?: string;
  linked_app_user_id?: string | null;
  linked_app_user_name?: string | null;
  linked_app_user_email?: string | null;
  linked_app_user_avatar_url?: string | null;
  last_ip?: string | null;
  credit_balance?: number;
}

export function toUiPlatformUser(u: PteroAppUser) {
  const fallbackName = `${u.first_name} ${u.last_name}`.trim() || u.username;
  return {
    id: String(u.id),
    name: u.linked_app_user_name ?? fallbackName,
    email: u.linked_app_user_email ?? u.email,
    avatarUrl: u.linked_app_user_avatar_url ?? undefined,
    plan: (u.root_admin ? "Enterprise" : "Pro") as "Starter" | "Pro" | "Scale" | "Enterprise",
    servers: u.server_count ?? 0,
    status: (u.status ?? "active") as "active" | "suspended" | "pending",
    country: u.country ?? "Unknown",
    flag: u.flag ?? "🌐",
    joined: u.created_at,
    spend: 0,
  };
}

/* ── Egg → Template card shape ── */
export interface PteroEgg {
  id: number;
  nest: number;
  name: string;
  description: string;
  docker_image: string;
}

const ABBR = (name: string) =>
  name.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "EG";

export function toUiTemplate(e: PteroEgg) {
  const img = e.docker_image.toLowerCase();
  const runtime: Runtime = /bun/.test(img) ? "bun" : /python/.test(img) ? "python" : /node|js/.test(img) ? "node" : "docker";
  return {
    id: String(e.id),
    name: e.name,
    description: e.description || "Deployable egg from your panel.",
    runtime,
    framework: e.name,
    category: "Starter" as const,
    language: runtime === "python" ? "Python" : runtime === "bun" ? "TypeScript" : "JavaScript",
    tags: [runtime, `nest-${e.nest}`],
    deploys: 0,
    stars: 0,
    author: "Panel",
    official: true,
    abbr: ABBR(e.name),
    color: "#2f6b85",
    eggId: e.id,
    nestId: e.nest,
  };
}
