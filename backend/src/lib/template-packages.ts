import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import type { PterodactylClient } from "./pterodactyl/client.js";

const MAX_TEMPLATE_ARCHIVE_BYTES = 15 * 1024 * 1024;
const MAX_VISIBLE_PATHS = 64;
const MAX_ARCHIVE_ENTRIES = 500;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const READY_RETRY_COUNT = 30;
const READY_RETRY_DELAY_MS = 2_000;
const DEBUG_ENV_PATH = path.resolve(process.cwd(), ".dbg", "template-bootstrap-owner.env");

export class TemplatePackageValidationError extends Error {
  statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "TemplatePackageValidationError";
  }
}

async function reportTemplatePackageDebugEvent(
  hypothesisId: "A" | "B" | "C" | "D" | "E",
  location: string,
  msg: string,
  data: Record<string, unknown>,
) {
  let debugServerUrl = "http://127.0.0.1:7777/event";
  let sessionId = "template-bootstrap-owner";
  try {
    const envFile = readFileSync(DEBUG_ENV_PATH, "utf8");
    debugServerUrl = envFile.match(/DEBUG_SERVER_URL=(.+)/)?.[1]?.trim() || debugServerUrl;
    sessionId = envFile.match(/DEBUG_SESSION_ID=(.+)/)?.[1]?.trim() || sessionId;
  } catch {}
  await fetch(debugServerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      runId: "pre-fix",
      hypothesisId,
      location,
      msg: `[DEBUG] ${msg}`,
      data,
      ts: Date.now(),
    }),
  }).catch(() => {});
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function templatePackageRoot() {
  return path.resolve(process.cwd(), "storage", "template-packages");
}

function normalizeArchivePath(input: string) {
  const normalized = input.replace(/\\/g, "/").trim().replace(/^\/+/, "");
  const parts = normalized
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.some((part) => part === "." || part === ".." || part.includes("\0"))) {
    throw new TemplatePackageValidationError("Template archive contains an invalid path.");
  }
  return parts.join("/");
}

function safeArchiveName(name: string) {
  const trimmed = name.trim().replace(/[\\/\u0000-\u001f\u007f]+/g, "_");
  if (!trimmed.toLowerCase().endsWith(".zip")) {
    throw new TemplatePackageValidationError("Template package must be a .zip archive.");
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "template.zip";
}

function decodeArchiveBase64(archiveName: string, archiveBase64: string) {
  const compact = archiveBase64.trim();
  if (!compact || compact.length % 4 !== 0 || !BASE64_PATTERN.test(compact)) {
    throw new TemplatePackageValidationError(`Template package "${archiveName}" is invalid.`);
  }
  const bytes = Buffer.from(compact, "base64");
  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_TEMPLATE_ARCHIVE_BYTES) {
    throw new TemplatePackageValidationError("Template package exceeds the 15 MB limit.");
  }
  return bytes;
}

async function loadArchiveManifest(bytes: Buffer) {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new TemplatePackageValidationError("Template package could not be opened.");
  }

  const files = new Set<string>();
  const directories = new Set<string>();

  for (const rawName of Object.keys(zip.files)) {
    const normalized = normalizeArchivePath(rawName);
    if (!normalized || normalized.startsWith("__MACOSX/")) continue;
    const segments = normalized.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      directories.add(segments.slice(0, index).join("/"));
    }
    const entry = zip.files[rawName];
    if (entry?.dir) {
      directories.add(normalized);
    } else {
      files.add(normalized);
    }
    if (files.size + directories.size > MAX_ARCHIVE_ENTRIES) {
      throw new TemplatePackageValidationError("Template package contains too many files.");
    }
  }

  if (files.size === 0) {
    throw new TemplatePackageValidationError("Template package does not contain any files.");
  }

  return {
    files: Array.from(files).sort((left, right) => left.localeCompare(right)),
    directories: Array.from(directories).sort((left, right) => left.localeCompare(right)),
  };
}

function resolveStoragePath(storageKey: string) {
  const root = templatePackageRoot();
  const normalizedKey = storageKey.replace(/\\/g, "/").trim();
  if (
    !normalizedKey ||
    normalizedKey.startsWith("/") ||
    normalizedKey.includes("../") ||
    normalizedKey === ".."
  ) {
    throw new TemplatePackageValidationError("Template package path is invalid.");
  }
  const fullPath = path.resolve(root, normalizedKey);
  const expectedPrefix = `${root}${path.sep}`;
  if (fullPath !== root && !fullPath.startsWith(expectedPrefix)) {
    throw new TemplatePackageValidationError("Template package path is invalid.");
  }
  return fullPath;
}

export async function inspectTemplatePackage(
  archiveName: string,
  archiveBase64: string,
) {
  const safeName = safeArchiveName(archiveName);
  const bytes = decodeArchiveBase64(safeName, archiveBase64);
  const manifest = await loadArchiveManifest(bytes);
  return {
    archiveName: safeName,
    archiveBytes: bytes,
    selectablePaths: [...manifest.directories, ...manifest.files].sort((left, right) =>
      left.localeCompare(right),
    ),
  };
}

export function validateTemplateVisiblePaths(
  input: unknown,
  selectablePaths: string[],
) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new TemplatePackageValidationError("Select at least one visible file or folder.");
  }
  if (input.length > MAX_VISIBLE_PATHS) {
    throw new TemplatePackageValidationError(`You can expose up to ${MAX_VISIBLE_PATHS} paths.`);
  }
  const allowed = new Set(selectablePaths);
  const normalized = Array.from(
    new Set(
      input.map((value) => {
        if (typeof value !== "string") {
          throw new TemplatePackageValidationError("Visible paths payload is invalid.");
        }
        return normalizeArchivePath(value);
      }),
    ),
  ).filter(Boolean);

  if (normalized.length === 0) {
    throw new TemplatePackageValidationError("Select at least one visible file or folder.");
  }

  for (const visiblePath of normalized) {
    if (!allowed.has(visiblePath)) {
      throw new TemplatePackageValidationError(
        `Selected visible path "${visiblePath}" is not part of the template package.`,
      );
    }
  }
  return normalized;
}

export async function persistTemplatePackage(
  templateId: string,
  archiveName: string,
  archiveBytes: Buffer,
) {
  const root = templatePackageRoot();
  await mkdir(root, { recursive: true });
  const storageKey = `${templateId}/${randomUUID()}-${safeArchiveName(archiveName)}`;
  const fullPath = resolveStoragePath(storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, archiveBytes);
  return { storageKey };
}

export async function deleteTemplatePackage(storageKey: string | null | undefined) {
  if (!storageKey) return;
  const fullPath = resolveStoragePath(storageKey);
  await rm(fullPath, { force: true });
}

async function readTemplatePackage(storageKey: string) {
  const fullPath = resolveStoragePath(storageKey);
  return readFile(fullPath);
}

async function waitForServerReady(client: PterodactylClient, serverId: string) {
  for (let attempt = 0; attempt < READY_RETRY_COUNT; attempt += 1) {
    try {
      const server = await client.getServer(serverId);
      // #region debug-point B:wait-loop
      await reportTemplatePackageDebugEvent("B", "template-packages.ts:waitForServerReady", "wait loop observed server state", {
        serverId,
        attempt,
        isInstalling: server.is_installing,
        status: server.status ?? null,
      });
      // #endregion
      if (!server.is_installing) return;
    } catch (error) {
      // #region debug-point B:wait-error
      await reportTemplatePackageDebugEvent("B", "template-packages.ts:waitForServerReady", "wait loop getServer failed", {
        serverId,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
      // #endregion
      // Keep retrying until the panel finishes provisioning.
    }
    await delay(READY_RETRY_DELAY_MS);
  }
  // #region debug-point B:wait-timeout
  await reportTemplatePackageDebugEvent("B", "template-packages.ts:waitForServerReady", "wait loop timed out", {
    serverId,
    retries: READY_RETRY_COUNT,
    retryDelayMs: READY_RETRY_DELAY_MS,
  });
  // #endregion
  throw new Error("Template package could not finish server installation in time.");
}

async function uploadArchiveToServer(
  client: PterodactylClient,
  serverId: string,
  archiveName: string,
  archiveBytes: Buffer,
) {
  const url = await client.uploadUrl(serverId);
  // #region debug-point A:upload-start
  await reportTemplatePackageDebugEvent("A", "template-packages.ts:uploadArchiveToServer", "uploading template archive to server", {
    serverId,
    archiveName,
    archiveBytes: archiveBytes.byteLength,
    uploadUrlHost: new URL(url).host,
  });
  // #endregion
  const form = new FormData();
  form.append(
    "files",
    new Blob([archiveBytes], { type: "application/zip" }),
    safeArchiveName(archiveName),
  );
  const response = await fetch(url, {
    method: "POST",
    body: form,
  });
  // #region debug-point E:upload-result
  await reportTemplatePackageDebugEvent("E", "template-packages.ts:uploadArchiveToServer", "upload request finished", {
    serverId,
    archiveName,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  });
  // #endregion
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Template archive upload failed.");
  }
}

export async function bootstrapTemplatePackage(
  client: PterodactylClient,
  serverId: string,
  archiveName: string,
  storageKey: string,
) {
  // #region debug-point A:bootstrap-start
  await reportTemplatePackageDebugEvent("A", "template-packages.ts:bootstrapTemplatePackage", "bootstrap started", {
    serverId,
    archiveName,
    storageKey,
  });
  // #endregion
  await waitForServerReady(client, serverId);
  const archiveBytes = await readTemplatePackage(storageKey);
  const archiveExt = path.extname(safeArchiveName(archiveName)) || ".zip";
  const serverArchiveName = `.atlas-template-${randomUUID()}${archiveExt}`;
  await uploadArchiveToServer(client, serverId, serverArchiveName, archiveBytes);
  // #region debug-point E:decompress-start
  await reportTemplatePackageDebugEvent("E", "template-packages.ts:bootstrapTemplatePackage", "starting decompress", {
    serverId,
    serverArchiveName,
  });
  // #endregion
  await client.decompressFile(serverId, "/", serverArchiveName);
  // #region debug-point E:decompress-done
  await reportTemplatePackageDebugEvent("E", "template-packages.ts:bootstrapTemplatePackage", "decompress finished", {
    serverId,
    serverArchiveName,
  });
  // #endregion
  await client.deleteFiles(serverId, "/", [serverArchiveName]).catch(() => {});

  try {
    const resources = await client.resources(serverId);
    // #region debug-point E:resources-after-bootstrap
    await reportTemplatePackageDebugEvent("E", "template-packages.ts:bootstrapTemplatePackage", "read resources after bootstrap", {
      serverId,
      currentState: resources.current_state,
    });
    // #endregion
    if (resources.current_state === "running" || resources.current_state === "starting") {
      await client.power(serverId, "restart");
      // #region debug-point E:power-restart
      await reportTemplatePackageDebugEvent("E", "template-packages.ts:bootstrapTemplatePackage", "restarting running server after bootstrap", {
        serverId,
      });
      // #endregion
      return;
    }
  } catch {
    // Fall through to start attempt below.
  }

  await client.power(serverId, "start");
  // #region debug-point E:power-start
  await reportTemplatePackageDebugEvent("E", "template-packages.ts:bootstrapTemplatePackage", "starting server after bootstrap", {
    serverId,
  });
  // #endregion
}

export function normalizeVisibleServerPath(input: string) {
  const normalized = normalizeArchivePath(input);
  return normalized;
}
