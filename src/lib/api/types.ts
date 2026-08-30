/**
 * Domain types used across the dashboard and marketing pages. Shapes mirror
 * what the BFF returns (see `backend/src/lib/pterodactyl/types.ts` for the
 * live panel shapes + the Prisma models for CMS rows).
 */

/* ── Server / runtime ── */
export type Runtime = "node" | "bun" | "python" | "docker";
export type ServerStatus =
  | "online"
  | "offline"
  | "installing"
  | "restarting"
  | "starting"
  | "stopping";

export interface Server {
  id: string;
  name: string;
  runtime: Runtime;
  runtimeVersion: string;
  status: ServerStatus;
  region: string;
  regionFlag: string;
  node: string;
  cpu: number; // percent
  ram: { used: number; total: number }; // MB
  disk: { used: number; total: number }; // MB
  uptimeSeconds: number;
  plan: string;
  ip: string;
  port: number;
  primaryDomain?: string;
  createdAt: string;
}

/* ── Marketing CMS shapes (mirror Prisma models) ── */
export interface Plan {
  id: string;
  slug?: string;
  name: string;
  tagline?: string;
  monthly: number;
  yearly: number;
  ram: number; // GB
  cpu: number; // vCPU
  storage: number; // GB
  backups: number;
  databases: number;
  networkPriority: "Standard" | "Priority" | "Dedicated";
  popular?: boolean;
  featured?: boolean;
  region?: "EU" | "US" | "TR" | "GLOBAL";
}

export interface Location {
  id: string;
  slug?: string;
  city: string;
  country: string;
  flag: string;
  region: "EU" | "US" | "TR";
  latencyMs: number;
  uptime: number;
  hardware: string;
  capacity: number; // percent used
  x: number; // map percent (legacy world-map coords)
  y: number;
  lat?: number;
  lng?: number;
  status?: "online" | "degraded" | "maintenance" | "offline";
}

export interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  uptime90: number;
}

export interface Incident {
  id: string;
  title: string;
  status: "resolved" | "monitoring" | "investigating" | "scheduled";
  severity: "minor" | "major" | "maintenance" | "critical";
  date: string;
  updates: { time: string; label: string; body: string }[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  tag: "feature" | "improvement" | "fix";
  title: string;
  points: string[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  column: "planned" | "in-progress" | "completed";
  votes: number;
  tag: string;
}

/* ── API keys / audit logs / notifications ── */
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created: string;
  lastUsed: string;
  expires: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  type: "auth" | "server" | "deploy" | "permission" | "billing" | "admin" | "system";
  ip: string;
  time: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "deploy" | "alert" | "billing" | "team" | "system";
  read: boolean;
  time: string;
}

/* ── Server-detail shapes ── */
export interface FileNode {
  name: string;
  type: "dir" | "file";
  size?: number;
  modified: string;
  ext?: string;
  children?: FileNode[];
}

/* ── Admin / platform shapes ── */
export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  plan: "Starter" | "Pro" | "Scale" | "Enterprise";
  servers: number;
  status: "active" | "suspended" | "pending";
  country: string;
  flag: string;
  joined: string;
  spend: number; // monthly
}

export interface PlatformNode {
  id: string;
  name: string;
  region: string;
  flag: string;
  status: "online" | "maintenance" | "offline";
  cpuLoad: number; // percent
  ram: { used: number; total: number }; // GB
  disk: { used: number; total: number }; // GB
  servers: number;
  uptimeDays: number;
  hardware: string;
}

/* ── Templates ── */
export type TemplateCategory =
  | "Starter"
  | "Framework"
  | "Music"
  | "Moderation"
  | "Economy"
  | "AI"
  | "Utility"
  | "Tickets";

export interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  runtime: Runtime;
  framework: string;
  category: TemplateCategory;
  language: string;
  tags: string[];
  deploys: number;
  stars: number;
  author: string;
  official: boolean;
  popular?: boolean;
  abbr: string;
  color: string;
  eggId?: number;
  nestId?: number;
  visiblePaths?: string[];
  packageArchiveName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateSubmission {
  id: string;
  name: string;
  description: string;
  runtime: Runtime;
  framework: string;
  category: TemplateCategory;
  language: string;
  tags: string[];
  repoUrl: string;
  notes?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

/* ── Runtime metadata (used by badges everywhere) ── */
export const RUNTIME_META: Record<Runtime, { label: string; color: string; mono: string }> = {
  node: { label: "Node.js", color: "#68a063", mono: "node" },
  bun: { label: "Discord", color: "#5865f2", mono: "disc" },
  python: { label: "Python", color: "#4b8bbe", mono: "python" },
  docker: { label: "Custom", color: "#2496ed", mono: "custom" },
};
