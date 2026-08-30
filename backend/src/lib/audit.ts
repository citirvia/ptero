import type { AuditType, Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export interface AuditInput {
  userId?: string | null;
  actorName: string;
  action: string;
  target?: string;
  type?: AuditType;
  ip?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/** Fire-and-forget audit write — never throws into the request path. */
export function recordAudit(input: AuditInput): void {
  prisma.auditLog
    .create({
      data: {
        userId: input.userId ?? null,
        actorName: input.actorName,
        action: input.action,
        target: input.target,
        type: input.type ?? "SYSTEM",
        ip: input.ip ?? null,
        metadata: input.metadata,
      },
    })
    .catch(() => {
      /* auditing must not break the request */
    });
}
