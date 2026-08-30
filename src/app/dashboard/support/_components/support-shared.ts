"use client";

import type { BadgeProps } from "@/components/ui/badge";

export const SUPPORT_CATEGORIES = ["BILLING", "DEPLOYMENT", "NETWORKING", "ACCOUNT", "OTHER"] as const;
export const SUPPORT_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const MAX_SUPPORT_ATTACHMENTS = 3;
export const MAX_SUPPORT_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/json",
  "application/pdf",
  "application/zip",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/log",
  "text/markdown",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = [".csv", ".gif", ".jpeg", ".jpg", ".json", ".log", ".md", ".pdf", ".png", ".txt", ".webp", ".zip"];

export type TicketStatus = "OPEN" | "WAITING_ON_STAFF" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
export type TicketPriority = (typeof SUPPORT_PRIORITIES)[number];
export type TicketCategory = (typeof SUPPORT_CATEGORIES)[number];

export type PendingAttachment = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataBase64: string;
};

export const STATUS_META: Record<TicketStatus, { label: string; variant: BadgeProps["variant"] }> = {
  OPEN: { label: "Open", variant: "info" },
  WAITING_ON_STAFF: { label: "Awaiting Staff", variant: "warn" },
  WAITING_ON_CUSTOMER: { label: "Awaiting Customer", variant: "accent" },
  RESOLVED: { label: "Resolved", variant: "online" },
  CLOSED: { label: "Closed", variant: "outline" },
};

export const PRIORITY_META: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "outline",
  NORMAL: "accent",
  HIGH: "warn",
  URGENT: "danger",
};

export const SUPPORT_SELECT_CLASS =
  "flex h-11 w-full rounded-2xl border border-line bg-bg/70 px-4 text-sm text-ink transition-colors hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function ticketNumber(number: number) {
  return `TKT-${String(number).padStart(5, "0")}`;
}

export function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function sanitizeFileName(name: string) {
  return name.replace(/[\\/\u0000-\u001f\u007f]+/g, "_").slice(0, 120);
}

function isAllowedFile(file: File) {
  const lower = file.name.toLowerCase();
  return ALLOWED_MIME_TYPES.has(file.type) || ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

async function fileToPayload(file: File): Promise<PendingAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const dataBase64 = result.split(",")[1] ?? "";
      resolve({
        name: sanitizeFileName(file.name),
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        dataBase64,
      });
    };
    reader.readAsDataURL(file);
  });
}

export async function filesToPayload(files: FileList | null): Promise<PendingAttachment[]> {
  const picked = Array.from(files ?? []);
  if (picked.length > MAX_SUPPORT_ATTACHMENTS) {
    throw new Error(`You can attach up to ${MAX_SUPPORT_ATTACHMENTS} files.`);
  }
  for (const file of picked) {
    if (file.size > MAX_SUPPORT_ATTACHMENT_BYTES) {
      throw new Error(`${file.name} exceeds the 5 MB limit.`);
    }
    if (!isAllowedFile(file)) {
      throw new Error(`${file.name} is not an allowed attachment type.`);
    }
  }
  return Promise.all(picked.map(fileToPayload));
}
