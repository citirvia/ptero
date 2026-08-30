"use client";

/**
 * Single source of dashboard + marketing data access. Every page that needs
 * server state imports from here; mutations are paired with TanStack Query
 * cache invalidation so the UI updates without a full reload.
 *
 * - Authenticated hooks pass `enabled: LIVE` (NEXT_PUBLIC_API_URL set) so they
 *   stay dormant in the offline showcase build.
 * - Public marketing hooks (`usePublic*`) ignore LIVE — they read read-only
 *   endpoints that work without an auth cookie.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { http, LIVE, ApiError } from "./client";

const opts = { enabled: LIVE, retry: 0 as const };
const PUBLIC_STALE = 60_000;

type SupportAttachmentInput = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataBase64: string;
};

/* ════════════════════════════════════════════════════════════════════════
   Servers (Pterodactyl Client API, per-user scope)
   ════════════════════════════════════════════════════════════════════════ */

export function useServers() {
  return useQuery({
    queryKey: ["servers"],
    queryFn: () => http.get<{ servers: unknown[] }>("/servers").then((r) => r.servers),
    ...opts,
  });
}

export function useServer(id: string) {
  return useQuery({
    queryKey: ["server", id],
    queryFn: () => http.get<{ server: unknown }>(`/servers/${id}`).then((r) => r.server),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useServerResources(id: string) {
  return useQuery({
    queryKey: ["resources", id],
    queryFn: async () => {
      try {
        const r = await http.get<{ resources: unknown }>(`/servers/${id}/resources`);
        return r.resources;
      } catch (err) {
        // 409 here means the server is installing / suspended / transferring —
        // resources just aren't reportable yet. Treat as "no data" instead of
        // spamming the console with a fetch error every 5 s.
        if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
          return null;
        }
        throw err;
      }
    },
    enabled: LIVE && !!id,
    refetchInterval: 5000,
    retry: 0,
  });
}

export function usePower(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (signal: "start" | "stop" | "restart" | "kill") =>
      http.post(`/servers/${id}/power`, { signal }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources", id] }),
  });
}

export function useSendCommand(id: string) {
  return useMutation({
    mutationFn: (command: string) => http.post(`/servers/${id}/command`, { command }),
  });
}

/* ── Self-service deploy ── */

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      http.post<{ server: unknown }>("/servers/provision", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servers"] }),
  });
}

export function usePromoCodePreview() {
  return useMutation({
    mutationFn: (body: { planId: string; couponCode: string }) =>
      http.post<{
        promo: { code: string; label?: string | null; type: string; amount: number };
        monthlyCredits: number;
        discountCredits: number;
        finalCredits: number;
      }>("/servers/promo-codes/preview", body),
  });
}

export function useRedeemPromoCode() {
  return useMutation({
    mutationFn: (body: { couponCode: string }) =>
      http.post<{ ok: true; code: string; amount: number; balanceAfter: number }>(
        "/account/promo-codes/redeem",
        body,
      ),
  });
}

/* ── Per-server history (DB-backed) ── */

export function useDeployments(id: string) {
  return useQuery({
    queryKey: ["deployments", id],
    queryFn: () =>
      http.get<{ deployments: unknown[] }>(`/servers/${id}/deployments`).then((r) => r.deployments),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useUsageHistory(id: string, range: "1h" | "24h" | "7d" = "1h") {
  return useQuery({
    queryKey: ["usage-history", id, range],
    queryFn: () =>
      http.get<{ snapshots: unknown[] }>(`/servers/${id}/usage-history?range=${range}`).then((r) => r.snapshots),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Files
   ════════════════════════════════════════════════════════════════════════ */

export function useFiles(id: string, directory = "/") {
  return useQuery({
    queryKey: ["files", id, directory],
    queryFn: () =>
      http
        .get<{ files: unknown[]; access: { restricted: boolean } }>(
          `/servers/${id}/files?directory=${encodeURIComponent(directory)}`,
        ),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useReadFile(id: string, file: string | null) {
  return useQuery({
    queryKey: ["file-contents", id, file],
    queryFn: () =>
      http
        .get<{ content: string }>(`/servers/${id}/files/contents?file=${encodeURIComponent(file!)}`)
        .then((r) => r.content),
    enabled: LIVE && !!id && !!file,
    retry: 0,
  });
}

export function useWriteFile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, content }: { file: string; content: string }) =>
      http.post(`/servers/${id}/files/write?file=${encodeURIComponent(file)}`, { content }),
    onSuccess: (_d, { file }) => {
      qc.invalidateQueries({ queryKey: ["file-contents", id, file] });
      qc.invalidateQueries({ queryKey: ["files", id] });
    },
  });
}

export function useUploadFileUrl(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      directory,
      files,
    }: {
      directory: string;
      files: File[];
    }) => {
      const { url } = await http.get<{ url: string }>(
        `/servers/${id}/files/upload?directory=${encodeURIComponent(directory)}`,
      );
      const form = new FormData();
      for (const file of files) {
        form.append("files", file, file.name);
      }
      const res = await fetch(url, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Upload failed.");
      }
      return { uploaded: files.length };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", id] }),
  });
}

export function useRenameFiles(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { root: string; files: { from: string; to: string }[] }) =>
      http.put(`/servers/${id}/files/rename`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", id] }),
  });
}

export function useCopyFile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (location: string) => http.post(`/servers/${id}/files/copy`, { location }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", id] }),
  });
}

export function useCompressFiles(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { root: string; files: string[] }) =>
      http.post(`/servers/${id}/files/compress`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", id] }),
  });
}

export function useDecompressFile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { root: string; file: string }) =>
      http.post(`/servers/${id}/files/decompress`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", id] }),
  });
}

export function useDeleteFiles(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { root: string; files: string[] }) =>
      http.post(`/servers/${id}/files/delete`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", id] }),
  });
}

export function useCreateFolder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { root: string; name: string }) =>
      http.post(`/servers/${id}/files/create-folder`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", id] }),
  });
}

export function useChmodFiles(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { root: string; files: { file: string; mode: string }[] }) =>
      http.post(`/servers/${id}/files/chmod`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", id] }),
  });
}

export function useDownloadFileUrl(id: string) {
  return useMutation({
    mutationFn: (file: string) =>
      http
        .get<{ url: string }>(`/servers/${id}/files/download?file=${encodeURIComponent(file)}`)
        .then((r) => r.url),
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Databases
   ════════════════════════════════════════════════════════════════════════ */

export function useDatabases(id: string) {
  return useQuery({
    queryKey: ["databases", id],
    queryFn: () =>
      http.get<{ databases: unknown[] }>(`/servers/${id}/databases`).then((r) => r.databases),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useCreateDatabase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { database: string; remote?: string }) =>
      http.post(`/servers/${id}/databases`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["databases", id] }),
  });
}

export function useRotateDbPassword(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dbId: string) => http.post(`/servers/${id}/databases/${dbId}/rotate-password`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["databases", id] }),
  });
}

export function useDeleteDatabase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dbId: string) => http.del(`/servers/${id}/databases/${dbId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["databases", id] }),
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Backups
   ════════════════════════════════════════════════════════════════════════ */

export function useBackups(id: string) {
  return useQuery({
    queryKey: ["backups", id],
    queryFn: () => http.get<{ backups: unknown[] }>(`/servers/${id}/backups`).then((r) => r.backups),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useCreateBackup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    // Always send `{}` minimum — the backend zod schema is permissive but
    // some intermediate proxies reject Content-Type: application/json with
    // no body, and the panel doesn't care about an empty object.
    mutationFn: (body?: { name?: string; ignored?: string }) =>
      http.post(`/servers/${id}/backups`, body ?? {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups", id] }),
  });
}

export function useDeleteBackup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (backup: string) => http.del(`/servers/${id}/backups/${backup}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups", id] }),
  });
}

export function useRestoreBackup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ backup, truncate = false }: { backup: string; truncate?: boolean }) =>
      http.post(`/servers/${id}/backups/${backup}/restore`, { truncate }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups", id] }),
  });
}

export function useLockBackup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (backup: string) => http.post(`/servers/${id}/backups/${backup}/lock`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups", id] }),
  });
}

export function useDownloadBackupUrl(id: string) {
  return useMutation({
    mutationFn: (backup: string) =>
      http.get<{ url: string }>(`/servers/${id}/backups/${backup}/download`).then((r) => r.url),
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Schedules + tasks
   ════════════════════════════════════════════════════════════════════════ */

export function useSchedules(id: string) {
  return useQuery({
    queryKey: ["schedules", id],
    queryFn: () =>
      http.get<{ schedules: unknown[] }>(`/servers/${id}/schedules`).then((r) => r.schedules),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useCreateSchedule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post(`/servers/${id}/schedules`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules", id] }),
  });
}

export function useUpdateSchedule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, body }: { scheduleId: number; body: Record<string, unknown> }) =>
      http.post(`/servers/${id}/schedules/${scheduleId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules", id] }),
  });
}

export function useDeleteSchedule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: number) => http.del(`/servers/${id}/schedules/${scheduleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules", id] }),
  });
}

export function useRunSchedule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: number) =>
      http.post(`/servers/${id}/schedules/${scheduleId}/execute`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules", id] }),
  });
}

export function useCreateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, body }: { scheduleId: number; body: Record<string, unknown> }) =>
      http.post(`/servers/${id}/schedules/${scheduleId}/tasks`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules", id] }),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      taskId,
      body,
    }: {
      scheduleId: number;
      taskId: number;
      body: Record<string, unknown>;
    }) => http.post(`/servers/${id}/schedules/${scheduleId}/tasks/${taskId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules", id] }),
  });
}

export function useDeleteTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, taskId }: { scheduleId: number; taskId: number }) =>
      http.del(`/servers/${id}/schedules/${scheduleId}/tasks/${taskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules", id] }),
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Network / allocations
   ════════════════════════════════════════════════════════════════════════ */

export function useAllocations(id: string) {
  return useQuery({
    queryKey: ["allocations", id],
    queryFn: () =>
      http.get<{ allocations: unknown[] }>(`/servers/${id}/network`).then((r) => r.allocations),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useCreateAllocation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http.post(`/servers/${id}/network`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allocations", id] }),
  });
}

export function useSetPrimaryAllocation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (allocId: number) => http.post(`/servers/${id}/network/${allocId}/primary`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allocations", id] }),
  });
}

export function useUpdateAllocationNotes(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ allocId, notes }: { allocId: number; notes: string }) =>
      http.post(`/servers/${id}/network/${allocId}/notes`, { notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allocations", id] }),
  });
}

export function useDeleteAllocation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (allocId: number) => http.del(`/servers/${id}/network/${allocId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allocations", id] }),
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Startup
   ════════════════════════════════════════════════════════════════════════ */

export function useStartup(id: string) {
  return useQuery({
    queryKey: ["startup", id],
    queryFn: () =>
      http.get<{ variables: unknown[]; meta: unknown }>(`/servers/${id}/startup`),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useSetStartupVar(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      http.put(`/servers/${id}/startup/variable`, { key, value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["startup", id] }),
  });
}

export function useDockerImages(id: string) {
  return useQuery({
    queryKey: ["docker-images", id],
    queryFn: () =>
      http
        .get<{ docker_images?: Record<string, string> }>(`/servers/${id}/docker-images`)
        .then((r) => r.docker_images ?? {}),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Server settings
   ════════════════════════════════════════════════════════════════════════ */

export function useRenameServer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => http.post(`/servers/${id}/settings/rename`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["server", id] });
      qc.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useReinstallServer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http.post(`/servers/${id}/settings/reinstall`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["server", id] }),
  });
}

export function useSetDockerImage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dockerImage: string) =>
      http.put(`/servers/${id}/settings/docker-image`, { docker_image: dockerImage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["server", id] });
      qc.invalidateQueries({ queryKey: ["startup", id] });
    },
  });
}

export function useDeleteServer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http.del(`/servers/${id}`),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["server", id] });
      qc.removeQueries({ queryKey: ["resources", id] });
      qc.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ["activity", id],
    queryFn: () =>
      http.get<{ activity: unknown[] }>(`/servers/${id}/activity`).then((r) => r.activity),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Account / settings
   ════════════════════════════════════════════════════════════════════════ */

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (body: { name?: string; email?: string; avatarUrl?: string | null }) =>
      http.patch("/settings/profile", body),
  });
}

export function useUpdatePreferences() {
  return useMutation({
    mutationFn: (body: { theme?: string }) => http.patch("/settings/preferences", body),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      http.post("/settings/password", {
        current: body.currentPassword,
        next: body.newPassword,
      }),
  });
}

export function useSetPanelKey() {
  return useMutation({
    mutationFn: (key: string) => http.put("/settings/panel-key", { key }),
  });
}

export function useDeletePanelKey() {
  return useMutation({
    mutationFn: () => http.del("/settings/panel-key"),
  });
}

export type Session = {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => http.get<{ sessions: Session[] }>("/sessions").then((r) => r.sessions),
    ...opts,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Notifications / audit logs
   ════════════════════════════════════════════════════════════════════════ */

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => http.get<{ notifications: unknown[]; unread: number }>("/notifications"),
    ...opts,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http.post("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useAuditLogs(params: { type?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.type && params.type !== "all") qs.set("type", params.type.toUpperCase());
  qs.set("page", String(params.page ?? 1));
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () =>
      http.get<{ logs: unknown[]; meta: { total: number; totalPages: number } }>(
        `/audit-logs?${qs}`,
      ),
    ...opts,
  });
}

/* ════════════════════════════════════════════════════════════════════════
   API keys
   ════════════════════════════════════════════════════════════════════════ */

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => http.get<{ keys: unknown[] }>("/api-keys").then((r) => r.keys),
    ...opts,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; scopes: string[]; expiresAt?: string }) =>
      http.post<{ token: string; key: unknown }>("/api-keys", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Support
   ════════════════════════════════════════════════════════════════════════ */

export function useSupportTickets() {
  return useQuery({
    queryKey: ["support", "tickets"],
    queryFn: () => http.get<{ tickets: unknown[] }>("/support/tickets").then((r) => r.tickets),
    ...opts,
  });
}

export function useSupportTicket(id: string | null) {
  return useQuery({
    queryKey: ["support", "ticket", id],
    queryFn: () => http.get<{ ticket: unknown }>(`/support/tickets/${id}`).then((r) => r.ticket),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      subject: string;
      category: string;
      priority: string;
      message: string;
      serverIdentifier?: string;
      attachments?: SupportAttachmentInput[];
    }) => http.post<{ ticket: unknown }>("/support/tickets", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useReplySupportTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { body: string; attachments?: SupportAttachmentInput[] }) =>
      http.post<{ ticket: unknown }>(`/support/tickets/${id}/messages`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["support", "ticket", id] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateSupportTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: "OPEN" | "CLOSED" }) => http.patch<{ ticket: unknown }>(`/support/tickets/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["support", "ticket", id] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAdminSupportTickets(params: {
  page?: number;
  perPage?: number;
  q?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
} = {}) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("per_page", String(params.perPage ?? 20));
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.priority) qs.set("priority", params.priority);
  if (params.assigneeId) qs.set("assigneeId", params.assigneeId);
  return useQuery({
    queryKey: ["admin", "support", "tickets", params],
    queryFn: () =>
      http.get<{ tickets: unknown[]; meta: unknown; counts: unknown }>(`/admin/support/tickets?${qs}`),
    ...opts,
  });
}

export function useAdminSupportTicket(id: string | null) {
  return useQuery({
    queryKey: ["admin", "support", "ticket", id],
    queryFn: () => http.get<{ ticket: unknown }>(`/admin/support/tickets/${id}`).then((r) => r.ticket),
    enabled: LIVE && !!id,
    retry: 0,
  });
}

export function useAdminUpdateSupportTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status?: string; priority?: string; assigneeId?: string | null }) =>
      http.patch<{ ticket: unknown }>(`/admin/support/tickets/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["admin", "support", "ticket", id] });
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["support", "ticket", id] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAdminReplySupportTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { body: string; internal?: boolean; attachments?: SupportAttachmentInput[] }) =>
      http.post<{ ticket: unknown }>(`/admin/support/tickets/${id}/messages`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["admin", "support", "ticket", id] });
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["support", "ticket", id] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Admin (Application API)
   ════════════════════════════════════════════════════════════════════════ */

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => http.get<Record<string, unknown>>("/admin/stats"),
    ...opts,
  });
}

export function useAdminSignupBonusSettings() {
  return useQuery({
    queryKey: ["admin", "settings", "signup-bonus"],
    queryFn: () => http.get<{ signupBonusCredits: number }>("/admin/settings/signup-bonus"),
    ...opts,
  });
}

export function useUpdateAdminSignupBonusSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (signupBonusCredits: number) =>
      http.patch<{ signupBonusCredits: number }>("/admin/settings/signup-bonus", {
        signupBonusCredits,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings", "signup-bonus"] });
    },
  });
}

export function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => http.get<{ users: unknown[]; meta: unknown }>(`/admin/users?page=${page}`),
    ...opts,
  });
}

export function useAdminUserDetail(id?: number | null) {
  return useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => http.get<{ user: unknown; linkedAppUser: unknown; summary: unknown }>(`/admin/users/${id}`),
    ...opts,
    enabled: LIVE && !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/users", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      http.patch(`/admin/users/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.del(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminImpersonateUser() {
  return useMutation({
    mutationFn: (id: number) => http.post<{ ok: boolean; user: { id: string; email: string; name: string } }>(`/admin/users/${id}/impersonate`),
  });
}

export function useAdminUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "ACTIVE" | "SUSPENDED" }) =>
      http.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminAdjustCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      description,
    }: {
      id: number;
      amount: number;
      description?: string;
    }) => http.post(`/admin/users/${id}/credits`, { amount, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useAdminNodes() {
  return useQuery({
    queryKey: ["admin", "nodes"],
    queryFn: () => http.get<{ nodes: unknown[] }>("/admin/nodes").then((r) => r.nodes),
    ...opts,
  });
}

export function useCreateNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/nodes", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "nodes"] }),
  });
}

export function useUpdateNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      http.patch(`/admin/nodes/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "nodes"] }),
  });
}

export function useDeleteNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.del(`/admin/nodes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "nodes"] }),
  });
}

export function useAdminServers(page = 1) {
  return useQuery({
    queryKey: ["admin", "servers", page],
    queryFn: () => http.get<{ servers: unknown[]; meta: unknown }>(`/admin/servers?page=${page}`),
    ...opts,
  });
}

export function useSuspendServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.post(`/admin/servers/${id}/suspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "servers"] }),
  });
}

export function useUnsuspendServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.post(`/admin/servers/${id}/unsuspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "servers"] }),
  });
}

export function useReinstallAdminServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.post(`/admin/servers/${id}/reinstall`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "servers"] }),
  });
}

export function useDeleteAdminServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.del(`/admin/servers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "servers"] }),
  });
}

export function useUpdateServerBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      http.patch(`/admin/servers/${id}/build`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "servers"] }),
  });
}

export function useUpdateServerDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      http.patch(`/admin/servers/${id}/details`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "servers"] }),
  });
}

export function useAdminProvisionServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/servers/provision", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "servers"] });
      qc.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useEggs() {
  return useQuery({
    queryKey: ["eggs"],
    queryFn: () => http.get<{ eggs: unknown[] }>("/admin/eggs").then((r) => r.eggs),
    ...opts,
  });
}

export function useDeployMetadata(enabled = true) {
  return useQuery({
    queryKey: ["deploy-metadata"],
    queryFn: () =>
      http.get<{ nodes: unknown[]; nests: unknown[]; eggs: unknown[]; locations: unknown[] }>(
        "/admin/deploy-metadata",
      ),
    enabled: LIVE && enabled,
    retry: 0,
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Admin marketing CMS (Plans / Incidents / Roadmap / Changelog / Locations)
   ════════════════════════════════════════════════════════════════════════ */

function cmsList(name: string) {
  return () =>
    http.get<{ items: unknown[]; meta?: unknown }>(`/admin/cms/${name}`).then((r) => r.items);
}

export const useAdminPlans = () =>
  useQuery({ queryKey: ["admin", "plans"], queryFn: cmsList("plans"), ...opts });
export const useAdminIncidents = () =>
  useQuery({ queryKey: ["admin", "incidents"], queryFn: cmsList("incidents"), ...opts });
export const useAdminRoadmap = () =>
  useQuery({ queryKey: ["admin", "roadmap"], queryFn: cmsList("roadmap"), ...opts });
export const useAdminChangelog = () =>
  useQuery({ queryKey: ["admin", "changelog"], queryFn: cmsList("changelog"), ...opts });
export const useAdminLocations = () =>
  useQuery({ queryKey: ["admin", "locations"], queryFn: cmsList("locations"), ...opts });
export const useAdminPromos = () =>
  useQuery({ queryKey: ["admin", "promos"], queryFn: cmsList("promos"), ...opts });

/* Plans */
export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/cms/plans", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}
export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      http.patch(`/admin/cms/plans/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}
export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/admin/cms/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}

/* Incidents */
export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/cms/incidents", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "incidents"] }),
  });
}
export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      http.patch(`/admin/cms/incidents/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "incidents"] }),
  });
}
export function useDeleteIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/admin/cms/incidents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "incidents"] }),
  });
}
export function useAppendIncidentUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { body: string; label?: string } }) =>
      http.post(`/admin/cms/incidents/${id}/updates`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "incidents"] }),
  });
}

/* Roadmap */
export function useCreateRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/cms/roadmap", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roadmap"] }),
  });
}
export function useUpdateRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      http.patch(`/admin/cms/roadmap/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roadmap"] }),
  });
}
export function useDeleteRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/admin/cms/roadmap/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roadmap"] }),
  });
}

/* Changelog */
export function useCreateChangelogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/cms/changelog", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "changelog"] }),
  });
}
export function useUpdateChangelogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      http.patch(`/admin/cms/changelog/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "changelog"] }),
  });
}
export function useDeleteChangelogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/admin/cms/changelog/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "changelog"] }),
  });
}

/* Locations */
export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/cms/locations", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "locations"] }),
  });
}
export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      http.patch(`/admin/cms/locations/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "locations"] }),
  });
}
export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/admin/cms/locations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "locations"] }),
  });
}

/* Promo codes */
export function useCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => http.post("/admin/cms/promos", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "promos"] }),
  });
}
export function useUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      http.patch(`/admin/cms/promos/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "promos"] }),
  });
}
export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/admin/cms/promos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "promos"] }),
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Public marketing reads (always enabled — no auth)
   ════════════════════════════════════════════════════════════════════════ */

function publicGet<T>(path: string): () => Promise<T> {
  return () => http.get<T>(path);
}

/**
 * The public-CMS hooks accept a generic row type so consumers can narrow the
 * `items` array to their domain shape (e.g. `usePublicPlans<PlanRow>()`).
 * Default is `unknown` — narrow only when you read into the rows.
 */
export function usePublicPlans<T = unknown>() {
  return useQuery({
    queryKey: ["public", "plans"],
    queryFn: publicGet<{ items: T[] }>("/public/plans"),
    enabled: LIVE,
    staleTime: PUBLIC_STALE,
    retry: 1,
  });
}

export function usePublicIncidents<T = unknown>(limit = 20) {
  return useQuery({
    queryKey: ["public", "incidents", limit],
    queryFn: publicGet<{ items: T[] }>(`/public/incidents?limit=${limit}`),
    enabled: LIVE,
    staleTime: PUBLIC_STALE,
    retry: 1,
  });
}

export function usePublicRoadmap<T = unknown>() {
  return useQuery({
    queryKey: ["public", "roadmap"],
    queryFn: publicGet<{
      groups: { PLANNED: T[]; IN_PROGRESS: T[]; COMPLETED: T[] };
    }>("/public/roadmap"),
    enabled: LIVE,
    staleTime: PUBLIC_STALE,
    retry: 1,
  });
}

export function usePublicChangelog<T = unknown>(limit = 20) {
  return useQuery({
    queryKey: ["public", "changelog", limit],
    queryFn: publicGet<{ items: T[] }>(`/public/changelog?limit=${limit}`),
    enabled: LIVE,
    staleTime: PUBLIC_STALE,
    retry: 1,
  });
}

export function usePublicLocations<T = unknown>() {
  return useQuery({
    queryKey: ["public", "locations"],
    queryFn: publicGet<{ items: T[] }>("/public/locations"),
    enabled: LIVE,
    staleTime: PUBLIC_STALE,
    retry: 1,
  });
}

export function usePublicStatus() {
  return useQuery({
    queryKey: ["public", "status"],
    queryFn: publicGet<{
      overall: string;
      services: { name: string; status: string }[];
      nodes: { name: string; status: string }[];
      incidents: { title: string; status: string }[];
    }>("/public/status"),
    enabled: LIVE,
    staleTime: PUBLIC_STALE,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => http.get<{ items: unknown[] }>("/templates").then((r) => r.items),
    ...opts,
  });
}

export function useTemplate(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["templates", slug],
    queryFn: () => http.get<{ item: unknown }>(`/templates/${encodeURIComponent(slug)}`).then((r) => r.item),
    enabled: LIVE && enabled && slug.trim().length > 0,
    retry: 0,
  });
}

export function useTemplateSubmissions(enabled = true) {
  return useQuery({
    queryKey: ["template-submissions"],
    queryFn: () =>
      http.get<{ items: unknown[] }>("/templates/submissions").then((r) => r.items),
    enabled: LIVE && enabled,
    retry: 0,
  });
}

export function useSubmitTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description: string;
      runtime: string;
      framework: string;
      category: string;
      language: string;
      tags: string[];
      eggId: number;
      nestId: number;
      archiveName: string;
      archiveBase64: string;
      visiblePaths: string[];
    }) => http.post<{ template: unknown }>("/templates", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["template-submissions"] });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.del(`/templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useSubmitSalesLead() {
  return useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      company: string;
      teamSize: string;
      message?: string;
      website?: string;
    }) => http.post<{ lead?: unknown; ok?: boolean }>("/sales-leads", body),
  });
}

/* ── re-exports ── */
export { LIVE } from "./client";
