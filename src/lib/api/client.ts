/**
 * Frontend API client for the Ptero backend (BFF).
 * - Live mode is active when NEXT_PUBLIC_API_URL is set.
 * - Uses httpOnly cookies for auth and refreshes once on 401.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const LIVE = API_URL.length > 0;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function raw(path: string, init: RequestInit, retry = true): Promise<Response> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  // Transparent one-shot refresh on expiry.
  if (res.status === 401 && retry && path !== "/auth/refresh" && path !== "/auth/login") {
    const ok = await refresh();
    if (ok) return raw(path, init, false);
  }
  return res;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await raw(path, init);
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { error?: string }).error ?? "Error",
      (data as { message?: string }).message ?? res.statusText,
    );
  }
  return data as T;
}

async function refresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const http = {
  get: <T>(p: string) => apiFetch<T>(p),
  post: <T>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(p: string) => apiFetch<T>(p, { method: "DELETE" }),
};

/** Console WebSocket URL (browser → BFF relay). */
export function consoleSocketUrl(id: string): string {
  const ws = API_URL.replace(/^http/, "ws");
  return `${ws}/api/servers/${id}/console`;
}

export function supportAttachmentUrl(id: string): string {
  return `${API_URL}/api/support/attachments/${id}`;
}

export function authEndpointUrl(path: string): string {
  return `${API_URL}/api${path}`;
}
