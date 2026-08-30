import { Agent, fetch as undiciFetch } from "undici";
import { env } from "../../config/env.js";
import { parsePteroError, PteroApiError } from "./errors.js";

// Optional self-signed TLS support (dev panels).
const insecureAgent = env.PTERO_ALLOW_INSECURE_TLS
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

export type PaginationMeta = {
  total: number;
  count: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
};

export interface ListResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  /** JSON body (object) — serialized automatically. */
  body?: unknown;
  /** Raw body (e.g. file contents) — sent as-is with the given content-type. */
  raw?: { content: string | Buffer; contentType: string };
  /** Expect a raw (non-JSON) response, returned as text. */
  rawResponse?: boolean;
  signal?: AbortSignal;
}

/**
 * Low-level Pterodactyl request. `base` is the API root
 * (e.g. `${panel}/api/client`), `key` the Bearer token.
 */
export async function pteroRequest<T = unknown>(
  base: string,
  key: string | undefined,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  if (!key) {
    throw new PteroApiError({
      status: 501,
      code: "MissingApiKey",
      detail:
        "Pterodactyl API key is not configured for this operation. Set PTERO_APP_KEY / PTERO_CLIENT_KEY.",
    });
  }

  const url = new URL(`${base}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };

  let body: string | Buffer | undefined;
  if (opts.raw) {
    body = opts.raw.content;
    headers["Content-Type"] = opts.raw.contentType;
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
  }

  const res = await undiciFetch(url, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
    ...(insecureAgent ? { dispatcher: insecureAgent } : {}),
  });

  if (res.status === 204) return undefined as T;

  if (opts.rawResponse) {
    const text = await res.text();
    if (!res.ok) throw parsePteroError(res.status, text);
    return text as unknown as T;
  }

  const text = await res.text();
  const json = text ? safeJson(text) : undefined;

  if (!res.ok) throw parsePteroError(res.status, json ?? text);
  return json as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Unwrap a Pterodactyl single object: `{ object, attributes }` → attributes. */
export function unwrap<T>(res: { attributes: T }): T {
  return res.attributes;
}

/** Unwrap a Pterodactyl list: `{ data: [{attributes}], meta }` → typed list. */
export function unwrapList<T>(res: {
  data: { attributes: T }[];
  meta?: { pagination?: Record<string, number> };
}): ListResult<T> {
  const p = res.meta?.pagination;
  return {
    items: (res.data ?? []).map((d) => d.attributes),
    meta: {
      total: p?.total ?? res.data?.length ?? 0,
      count: p?.count ?? res.data?.length ?? 0,
      perPage: p?.per_page ?? res.data?.length ?? 0,
      currentPage: p?.current_page ?? 1,
      totalPages: p?.total_pages ?? 1,
    },
  };
}
