import { env } from "../../config/env.js";
import { pteroRequest, unwrap, unwrapList, type ListResult } from "./http.js";
import type {
  Account,
  ActivityLog,
  ClientAllocation,
  ClientBackup,
  ClientDatabase,
  ClientResources,
  ClientSchedule,
  ClientServer,
  ClientTask,
  FileObject,
  StartupVariable,
  WebsocketCredentials,
} from "./types.js";

const BASE = `${env.PTERO_PANEL_URL}/api/client`;

/**
 * Pterodactyl Client API. Uses a Client key (ptlc_…). Operates on the
 * short server identifier (8 chars). `keyOverride` allows per-user keys.
 */
export class PterodactylClient {
  constructor(private readonly key: string | undefined = env.PTERO_CLIENT_KEY) {}

  private req<T>(path: string, opts?: Parameters<typeof pteroRequest>[3]) {
    return pteroRequest<T>(BASE, this.key, path, opts);
  }

  /* ── Account ── */
  async account(): Promise<Account> {
    return unwrap(await this.req<{ attributes: Account }>("/account"));
  }
  async apiKeys() {
    const res = await this.req<{ data: { attributes: unknown }[] }>(
      "/account/api-keys",
    );
    return res.data.map((d) => d.attributes);
  }

  /* ── Servers ── */
  async listServers(): Promise<ListResult<ClientServer>> {
    const res = await this.req<{
      data: { attributes: ClientServer }[];
      meta?: { pagination?: Record<string, number> };
    }>("/", { query: { "include": "allocations" } });
    return unwrapList(res);
  }

  async getServer(id: string): Promise<ClientServer> {
    return unwrap(
      await this.req<{ attributes: ClientServer }>(`/servers/${id}`, {
        query: { include: "allocations" },
      }),
    );
  }

  async resources(id: string): Promise<ClientResources> {
    return unwrap(
      await this.req<{ attributes: ClientResources }>(
        `/servers/${id}/resources`,
      ),
    );
  }

  async power(id: string, signal: "start" | "stop" | "restart" | "kill") {
    await this.req(`/servers/${id}/power`, { method: "POST", body: { signal } });
  }

  async command(id: string, command: string) {
    await this.req(`/servers/${id}/command`, {
      method: "POST",
      body: { command },
    });
  }

  async websocket(id: string): Promise<WebsocketCredentials> {
    const res = await this.req<{ data: WebsocketCredentials }>(
      `/servers/${id}/websocket`,
    );
    return res.data;
  }

  /* ── Files ── */
  async listFiles(id: string, directory = "/"): Promise<FileObject[]> {
    const res = await this.req<{ data: { attributes: FileObject }[] }>(
      `/servers/${id}/files/list`,
      { query: { directory } },
    );
    return res.data.map((d) => d.attributes);
  }
  async fileContents(id: string, file: string): Promise<string> {
    return this.req<string>(`/servers/${id}/files/contents`, {
      query: { file },
      rawResponse: true,
    });
  }
  async writeFile(id: string, file: string, content: string) {
    await this.req(`/servers/${id}/files/write`, {
      method: "POST",
      query: { file },
      raw: { content, contentType: "text/plain" },
    });
  }
  async downloadFile(id: string, file: string): Promise<string> {
    const res = await this.req<{ attributes: { url: string } }>(
      `/servers/${id}/files/download`,
      { query: { file } },
    );
    return res.attributes.url;
  }
  async uploadUrl(id: string): Promise<string> {
    const res = await this.req<{ attributes: { url: string } }>(
      `/servers/${id}/files/upload`,
    );
    return res.attributes.url;
  }
  async renameFiles(id: string, root: string, files: { from: string; to: string }[]) {
    await this.req(`/servers/${id}/files/rename`, {
      method: "PUT",
      body: { root, files },
    });
  }
  async copyFile(id: string, location: string) {
    await this.req(`/servers/${id}/files/copy`, {
      method: "POST",
      body: { location },
    });
  }
  async compressFiles(id: string, root: string, files: string[]) {
    const res = await this.req<{ attributes: FileObject }>(
      `/servers/${id}/files/compress`,
      { method: "POST", body: { root, files } },
    );
    return res.attributes;
  }
  async decompressFile(id: string, root: string, file: string) {
    await this.req(`/servers/${id}/files/decompress`, {
      method: "POST",
      body: { root, file },
    });
  }
  async deleteFiles(id: string, root: string, files: string[]) {
    await this.req(`/servers/${id}/files/delete`, {
      method: "POST",
      body: { root, files },
    });
  }
  async createFolder(id: string, root: string, name: string) {
    await this.req(`/servers/${id}/files/create-folder`, {
      method: "POST",
      body: { root, name },
    });
  }
  async chmodFiles(
    id: string,
    root: string,
    files: { file: string; mode: string }[],
  ) {
    await this.req(`/servers/${id}/files/chmod`, {
      method: "POST",
      body: { root, files },
    });
  }

  /* ── Databases ── */
  async listDatabases(id: string): Promise<ClientDatabase[]> {
    const res = await this.req<{ data: { attributes: ClientDatabase }[] }>(
      `/servers/${id}/databases`,
      { query: { include: "password" } },
    );
    return res.data.map((d) => d.attributes);
  }
  async createDatabase(id: string, database: string, remote = "%") {
    return unwrap(
      await this.req<{ attributes: ClientDatabase }>(
        `/servers/${id}/databases`,
        { method: "POST", body: { database, remote } },
      ),
    );
  }
  async rotateDatabasePassword(id: string, db: string) {
    return unwrap(
      await this.req<{ attributes: ClientDatabase }>(
        `/servers/${id}/databases/${db}/rotate-password`,
        { method: "POST" },
      ),
    );
  }
  async deleteDatabase(id: string, db: string) {
    await this.req(`/servers/${id}/databases/${db}`, { method: "DELETE" });
  }

  /* ── Backups ── */
  async listBackups(id: string): Promise<ListResult<ClientBackup>> {
    return unwrapList(
      await this.req<{ data: { attributes: ClientBackup }[]; meta?: { pagination?: Record<string, number> } }>(
        `/servers/${id}/backups`,
      ),
    );
  }
  async createBackup(id: string, name?: string, ignored?: string) {
    return unwrap(
      await this.req<{ attributes: ClientBackup }>(`/servers/${id}/backups`, {
        method: "POST",
        body: { name, ignored },
      }),
    );
  }
  async backupDownload(id: string, backup: string): Promise<string> {
    const res = await this.req<{ attributes: { url: string } }>(
      `/servers/${id}/backups/${backup}/download`,
    );
    return res.attributes.url;
  }
  async toggleBackupLock(id: string, backup: string) {
    return unwrap(
      await this.req<{ attributes: ClientBackup }>(
        `/servers/${id}/backups/${backup}/lock`,
        { method: "POST" },
      ),
    );
  }
  async restoreBackup(id: string, backup: string, truncate = false) {
    await this.req(`/servers/${id}/backups/${backup}/restore`, {
      method: "POST",
      body: { truncate },
    });
  }
  async deleteBackup(id: string, backup: string) {
    await this.req(`/servers/${id}/backups/${backup}`, { method: "DELETE" });
  }

  /* ── Schedules ── */
  async listSchedules(id: string): Promise<ClientSchedule[]> {
    const res = await this.req<{ data: { attributes: ClientSchedule }[] }>(
      `/servers/${id}/schedules`,
      { query: { include: "tasks" } },
    );
    return res.data.map((d) => d.attributes);
  }
  async createSchedule(id: string, body: Record<string, unknown>) {
    return unwrap(
      await this.req<{ attributes: ClientSchedule }>(
        `/servers/${id}/schedules`,
        { method: "POST", body },
      ),
    );
  }
  async updateSchedule(id: string, schedule: number, body: Record<string, unknown>) {
    return unwrap(
      await this.req<{ attributes: ClientSchedule }>(
        `/servers/${id}/schedules/${schedule}`,
        { method: "POST", body },
      ),
    );
  }
  async deleteSchedule(id: string, schedule: number) {
    await this.req(`/servers/${id}/schedules/${schedule}`, { method: "DELETE" });
  }
  async executeSchedule(id: string, schedule: number) {
    await this.req(`/servers/${id}/schedules/${schedule}/execute`, {
      method: "POST",
    });
  }
  async createTask(
    id: string,
    schedule: number,
    body: Record<string, unknown>,
  ) {
    return unwrap(
      await this.req<{ attributes: ClientTask }>(
        `/servers/${id}/schedules/${schedule}/tasks`,
        { method: "POST", body },
      ),
    );
  }
  async updateTask(
    id: string,
    schedule: number,
    task: number,
    body: Record<string, unknown>,
  ) {
    return unwrap(
      await this.req<{ attributes: ClientTask }>(
        `/servers/${id}/schedules/${schedule}/tasks/${task}`,
        { method: "POST", body },
      ),
    );
  }
  async deleteTask(id: string, schedule: number, task: number) {
    await this.req(
      `/servers/${id}/schedules/${schedule}/tasks/${task}`,
      { method: "DELETE" },
    );
  }

  /* ── Network / allocations ── */
  async listAllocations(id: string): Promise<ClientAllocation[]> {
    const res = await this.req<{ data: { attributes: ClientAllocation }[] }>(
      `/servers/${id}/network/allocations`,
    );
    return res.data.map((d) => d.attributes);
  }
  async assignAllocation(id: string) {
    return unwrap(
      await this.req<{ attributes: ClientAllocation }>(
        `/servers/${id}/network/allocations`,
        { method: "POST" },
      ),
    );
  }
  async setAllocationNote(id: string, allocation: number, notes: string) {
    return unwrap(
      await this.req<{ attributes: ClientAllocation }>(
        `/servers/${id}/network/allocations/${allocation}`,
        { method: "POST", body: { notes } },
      ),
    );
  }
  async setPrimaryAllocation(id: string, allocation: number) {
    return unwrap(
      await this.req<{ attributes: ClientAllocation }>(
        `/servers/${id}/network/allocations/${allocation}/primary`,
        { method: "POST" },
      ),
    );
  }
  async deleteAllocation(id: string, allocation: number) {
    await this.req(`/servers/${id}/network/allocations/${allocation}`, {
      method: "DELETE",
    });
  }

  /* ── Startup ── */
  async startup(id: string): Promise<{
    variables: StartupVariable[];
    meta: {
      startup_command?: string;
      raw_startup_command?: string;
      docker_images?: Record<string, string>;
    };
  }> {
    const res = await this.req<{
      data: { attributes: StartupVariable }[];
      meta: {
        startup_command?: string;
        raw_startup_command?: string;
        docker_images?: Record<string, string>;
      };
    }>(`/servers/${id}/startup`);
    return { variables: res.data.map((d) => d.attributes), meta: res.meta };
  }
  async dockerImages(id: string): Promise<Record<string, string>> {
    const { meta } = await this.startup(id);
    return meta?.docker_images ?? {};
  }
  async setVariable(id: string, key: string, value: string) {
    return unwrap(
      await this.req<{ attributes: StartupVariable }>(
        `/servers/${id}/startup/variable`,
        { method: "PUT", body: { key, value } },
      ),
    );
  }

  /* ── Settings ── */
  async rename(id: string, name: string) {
    await this.req(`/servers/${id}/settings/rename`, {
      method: "POST",
      body: { name },
    });
  }
  async reinstall(id: string) {
    await this.req(`/servers/${id}/settings/reinstall`, { method: "POST" });
  }
  async setDockerImage(id: string, dockerImage: string) {
    await this.req(`/servers/${id}/settings/docker-image`, {
      method: "PUT",
      body: { docker_image: dockerImage },
    });
  }

  /* ── Activity ── */
  async activity(id: string): Promise<ActivityLog[]> {
    const res = await this.req<{ data: { attributes: ActivityLog }[] }>(
      `/servers/${id}/activity`,
    );
    return res.data.map((d) => d.attributes);
  }
}

export const pteroClient = new PterodactylClient();
