/** Normalized error thrown by the Pterodactyl clients. */
export class PteroApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly raw: unknown;

  constructor(opts: {
    status: number;
    code?: string;
    detail?: string;
    raw?: unknown;
  }) {
    super(opts.detail || `Pterodactyl request failed (${opts.status})`);
    this.name = "PteroApiError";
    this.status = opts.status;
    this.code = opts.code ?? "PterodactylError";
    this.detail = opts.detail ?? this.message;
    this.raw = opts.raw;
  }
}

interface PteroErrorBody {
  errors?: { code?: string; status?: string; detail?: string }[];
}

export function parsePteroError(status: number, body: unknown): PteroApiError {
  const b = body as PteroErrorBody | undefined;
  const first = b?.errors?.[0];
  return new PteroApiError({
    status,
    code: first?.code,
    detail: first?.detail,
    raw: body,
  });
}
