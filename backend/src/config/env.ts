import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

/** Minimal .env loader (no dependency). Does not override existing env vars. */
function loadDotenv(file = ".env") {
  try {
    const raw = readFileSync(resolve(process.cwd(), file), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* no .env file — rely on real environment */
  }
}

loadDotenv();

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (postgresql://…)"),
  ENCRYPTION_KEY: z
    .string()
    .min(16, "ENCRYPTION_KEY must be at least 16 chars (used to encrypt panel keys)"),
  WEBHOOK_SECRET: z
    .string()
    .min(16, "WEBHOOK_SECRET must be at least 16 chars")
    .optional(),

  PTERO_PANEL_URL: z
    .string()
    .url("PTERO_PANEL_URL must be a valid URL")
    .transform((u) => u.replace(/\/+$/, "")),
  PTERO_APP_KEY: z.string().optional(),
  PTERO_CLIENT_KEY: z.string().optional(),
  PTERO_ALLOW_INSECURE_TLS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  WINGS_NODE_FQDN: z.string().default("node.playboi.cc"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AUTH_ADMIN_EMAIL: z.string().email().default("admin@playboi.cc"),
  AUTH_ADMIN_PASSWORD: z.string().min(1).default("change-me"),

  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_REDIRECT_URI: z.string().url().optional(),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW: z.string().default("1 minute"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with a readable message.
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const hasAppKey = !!env.PTERO_APP_KEY;
export const hasClientKey = !!env.PTERO_CLIENT_KEY;
