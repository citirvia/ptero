import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_SUPPORT_ATTACHMENTS = 3;
export const MAX_SUPPORT_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil((MAX_SUPPORT_ATTACHMENT_BYTES / 3) * 4) + 4;

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

const ALLOWED_EXTENSIONS = new Set([
  ".csv",
  ".gif",
  ".jpeg",
  ".jpg",
  ".json",
  ".log",
  ".md",
  ".pdf",
  ".png",
  ".txt",
  ".webp",
  ".zip",
]);

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export interface SupportAttachmentInput {
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataBase64: string;
}

export class SupportAttachmentValidationError extends Error {
  statusCode = 400;
  code = "InvalidAttachment";

  constructor(message: string) {
    super(message);
    this.name = "SupportAttachmentValidationError";
  }
}

function supportAttachmentRoot() {
  return path.resolve(process.cwd(), "storage", "support-attachments");
}

function normalizeAttachmentName(name: string) {
  return name.replace(/[\\/\u0000-\u001f\u007f]+/g, "_").trim().slice(0, 120) || "attachment.bin";
}

function safeName(name: string) {
  return normalizeAttachmentName(name).replace(/[^a-zA-Z0-9._-]/g, "_") || "attachment.bin";
}

function normalizeMimeType(mimeType: string) {
  return mimeType.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

function assertAttachmentAllowed(name: string, mimeType: string) {
  const extension = path.extname(name).toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(extension)) {
    throw new SupportAttachmentValidationError(
      `Attachment "${name}" is not an allowed file type.`,
    );
  }
}

function normalizeBase64(dataBase64: string, name: string) {
  const compact = dataBase64.trim();
  if (!compact) {
    throw new SupportAttachmentValidationError(`Attachment "${name}" is empty.`);
  }
  if (compact.length > MAX_BASE64_LENGTH) {
    throw new SupportAttachmentValidationError(`Attachment "${name}" exceeds the 5 MB limit.`);
  }
  if (compact.length % 4 !== 0 || !BASE64_PATTERN.test(compact)) {
    throw new SupportAttachmentValidationError(`Attachment "${name}" contains invalid data.`);
  }
  const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0;
  const estimatedBytes = Math.floor((compact.length / 4) * 3) - padding;
  if (estimatedBytes <= 0 || estimatedBytes > MAX_SUPPORT_ATTACHMENT_BYTES) {
    throw new SupportAttachmentValidationError(`Attachment "${name}" exceeds the 5 MB limit.`);
  }
  return compact;
}

function resolveSupportStoragePath(storageKey: string) {
  const root = supportAttachmentRoot();
  const normalizedKey = storageKey.replace(/\\/g, "/").trim();
  if (
    !normalizedKey ||
    normalizedKey.startsWith("/") ||
    normalizedKey.includes("../") ||
    normalizedKey === ".."
  ) {
    throw new SupportAttachmentValidationError("Attachment path is invalid.");
  }
  const fullPath = path.resolve(root, normalizedKey);
  const expectedPrefix = `${root}${path.sep}`;
  if (fullPath !== root && !fullPath.startsWith(expectedPrefix)) {
    throw new SupportAttachmentValidationError("Attachment path is invalid.");
  }
  return fullPath;
}

export function normalizeSupportAttachments(input: unknown): SupportAttachmentInput[] {
  if (input == null) return [];
  if (!Array.isArray(input)) {
    throw new SupportAttachmentValidationError("Attachments payload is invalid.");
  }
  if (input.length > MAX_SUPPORT_ATTACHMENTS) {
    throw new SupportAttachmentValidationError(
      `You can attach up to ${MAX_SUPPORT_ATTACHMENTS} files.`,
    );
  }
  return input.map((item) => {
    if (!item || typeof item !== "object") {
      throw new SupportAttachmentValidationError("Attachments payload is invalid.");
    }
    const candidate = item as Partial<SupportAttachmentInput>;
    const name = typeof candidate.name === "string" ? normalizeAttachmentName(candidate.name) : "";
    const mimeType = normalizeMimeType(
      typeof candidate.mimeType === "string" ? candidate.mimeType : "application/octet-stream",
    );
    const sizeBytes =
      typeof candidate.sizeBytes === "number" ? candidate.sizeBytes : Number(candidate.sizeBytes);
    if (!name || !Number.isInteger(sizeBytes) || !Number.isFinite(sizeBytes)) {
      throw new SupportAttachmentValidationError("Attachments payload is invalid.");
    }
    if (sizeBytes <= 0 || sizeBytes > MAX_SUPPORT_ATTACHMENT_BYTES) {
      throw new SupportAttachmentValidationError(`Attachment "${name}" exceeds the 5 MB limit.`);
    }
    assertAttachmentAllowed(name, mimeType);
    const dataBase64 = normalizeBase64(
      typeof candidate.dataBase64 === "string" ? candidate.dataBase64 : "",
      name,
    );
    return { name, mimeType, sizeBytes, dataBase64 };
  });
}

export async function persistSupportAttachments(messageId: string, attachments: SupportAttachmentInput[]) {
  if (attachments.length === 0) return [];
  const root = supportAttachmentRoot();
  await mkdir(root, { recursive: true });

  const messageFolder = safeName(messageId);

  const stored: Array<{ name: string; mimeType: string; sizeBytes: number; storageKey: string }> = [];
  for (const attachment of attachments.slice(0, MAX_SUPPORT_ATTACHMENTS)) {
    if (attachment.sizeBytes <= 0 || attachment.sizeBytes > MAX_SUPPORT_ATTACHMENT_BYTES) {
      throw new SupportAttachmentValidationError(
        `Attachment "${attachment.name}" exceeds the 5 MB limit.`,
      );
    }
    assertAttachmentAllowed(attachment.name, attachment.mimeType);
    const bytes = Buffer.from(attachment.dataBase64, "base64");
    if (bytes.byteLength !== attachment.sizeBytes) {
      throw new SupportAttachmentValidationError(
        `Attachment "${attachment.name}" is corrupted or incomplete.`,
      );
    }
    const storageKey = `${messageFolder}/${randomUUID()}-${safeName(attachment.name)}`;
    const fullPath = resolveSupportStoragePath(storageKey);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, bytes);
    stored.push({
      name: normalizeAttachmentName(attachment.name),
      mimeType: normalizeMimeType(attachment.mimeType),
      sizeBytes: bytes.byteLength,
      storageKey,
    });
  }
  return stored;
}

export async function readSupportAttachment(storageKey: string) {
  const fullPath = resolveSupportStoragePath(storageKey);
  return readFile(fullPath);
}

export function toDownloadAttachmentName(name: string) {
  return normalizeAttachmentName(name).replace(/["]/g, "_");
}
