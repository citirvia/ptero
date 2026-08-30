/* ───────────────────────────────────────────────────────────────────────────
   Pterodactyl API attribute shapes (subset used by the BFF).
   Docs: https://dashflo.net/docs/api/pterodactyl/v1/
   ─────────────────────────────────────────────────────────────────────────── */

/* ── Client API ── */
export interface ClientServer {
  server_owner: boolean;
  identifier: string;
  uuid: string;
  name: string;
  node: string;
  description: string;
  status: string | null;
  is_suspended: boolean;
  is_installing: boolean;
  sftp_details: { ip: string; port: number };
  limits: { memory: number; swap: number; disk: number; io: number; cpu: number };
  feature_limits: { databases: number; allocations: number; backups: number };
  relationships?: {
    allocations?: { data: { attributes: ClientAllocation }[] };
  };
}

export interface ClientResources {
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

export interface ClientAllocation {
  id: number;
  ip: string;
  ip_alias: string | null;
  port: number;
  notes: string | null;
  is_default: boolean;
}

export interface FileObject {
  name: string;
  mode: string;
  mode_bits: string;
  size: number;
  is_file: boolean;
  is_symlink: boolean;
  mimetype: string;
  created_at: string;
  modified_at: string;
}

export interface ClientDatabase {
  id: string;
  host: { address: string; port: number };
  name: string;
  username: string;
  connections_from: string;
  max_connections: number;
  relationships?: { password?: { attributes: { password: string } } };
}

export interface ClientBackup {
  uuid: string;
  name: string;
  ignored_files: string[];
  sha256_hash: string | null;
  bytes: number;
  is_locked: boolean;
  is_successful: boolean;
  checksum: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ClientSchedule {
  id: number;
  name: string;
  cron: {
    day_of_week: string;
    day_of_month: string;
    month: string;
    hour: string;
    minute: string;
  };
  is_active: boolean;
  is_processing: boolean;
  only_when_online: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  relationships?: { tasks?: { data: { attributes: ClientTask }[] } };
}

export interface ClientTask {
  id: number;
  sequence_id: number;
  action: string;
  payload: string;
  time_offset: number;
  is_queued: boolean;
}

export interface StartupVariable {
  name: string;
  description: string;
  env_variable: string;
  default_value: string;
  server_value: string | null;
  is_editable: boolean;
  rules: string;
}

export interface ClientStartup {
  startup_command?: string;
  raw_startup_command?: string;
  docker_images?: Record<string, string>;
  variables?: { attributes: StartupVariable }[];
}

export interface ActivityLog {
  id: string;
  batch: string | null;
  event: string;
  is_api: boolean;
  ip: string | null;
  description: string | null;
  properties: Record<string, unknown>;
  timestamp: string;
}

export interface Account {
  id: number;
  admin: boolean;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
}

export interface WebsocketCredentials {
  token: string;
  socket: string;
}

/* ── Application API ── */
export interface AppUser {
  id: number;
  external_id: string | null;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
  root_admin: boolean;
  "2fa": boolean;
  created_at: string;
  updated_at: string;
}

export interface AppNode {
  id: number;
  uuid: string;
  public: boolean;
  name: string;
  description: string | null;
  location_id: number;
  fqdn: string;
  scheme: string;
  behind_proxy: boolean;
  maintenance_mode: boolean;
  memory: number;
  memory_overallocate: number;
  disk: number;
  disk_overallocate: number;
  upload_size: number;
  daemon_listen: number;
  daemon_sftp: number;
  created_at: string;
  allocated_resources?: { memory: number; disk: number };
}

export interface AppLocation {
  id: number;
  short: string;
  long: string;
  created_at: string;
  updated_at: string;
}

export interface AppServer {
  id: number;
  external_id: string | null;
  uuid: string;
  identifier: string;
  name: string;
  description: string;
  status: string | null;
  suspended: boolean;
  limits: { memory: number; swap: number; disk: number; io: number; cpu: number };
  feature_limits: { databases: number; allocations: number; backups: number };
  user: number;
  node: number;
  allocation: number;
  nest: number;
  egg: number;
  created_at: string;
}

export interface AppNest {
  id: number;
  uuid: string;
  author: string;
  name: string;
  description: string;
  created_at: string;
}

export interface AppEgg {
  id: number;
  uuid: string;
  name: string;
  description: string;
  docker_image: string;
  startup: string;
}

export interface AppAllocation {
  id: number;
  ip: string;
  alias: string | null;
  port: number;
  notes: string | null;
  assigned: boolean;
}
