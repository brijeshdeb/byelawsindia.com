/**
 * Environment validation using Zod.
 * This file is the single source of truth for environment variables.
 * All env access in the codebase should go through this module,
 * not through process.env directly.
 *
 * Validation runs at module load time — a missing required variable
 * will throw immediately rather than failing silently at runtime.
 */
import { z } from "zod";

// ── Server-only environment schema ───────────────────────────────────────────
// These values must never reach the browser bundle.
const serverSchema = z.object({
  // Supabase service role — server-only, never expose to client
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // Email — optional until Resend is configured in production
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).default("Byelawsindia Portal"),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Storage
  STORAGE_BUCKET_DOCUMENTS: z.string().default("society-documents"),
  STORAGE_BUCKET_AVATARS: z.string().default("avatars"),
  STORAGE_SIGNED_URL_TTL: z.coerce.number().int().positive().default(60),

  // Rate limiting
  RATE_LIMIT_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_LOGIN_WINDOW_SECONDS: z.coerce.number().int().positive().default(300),

  // File uploads
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().int().positive().default(10485760),

  // App environment
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
});

// ── Client-safe environment schema ───────────────────────────────────────────
// These are prefixed NEXT_PUBLIC_ and available in the browser.
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Supabase URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("App URL must be a valid URL").default("http://localhost:3000"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

// ── Validate and export ───────────────────────────────────────────────────────
function validateEnv() {
  const isServer = typeof window === "undefined";

  // Always validate client schema (safe to do on both sides)
  const clientResult = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  if (!clientResult.success) {
    const formatted = clientResult.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Missing or invalid client environment variables:\n${formatted}`);
  }

  if (isServer) {
    const serverResult = serverSchema.safeParse(process.env);
    if (!serverResult.success) {
      const formatted = serverResult.error.issues
        .map((i) => `  ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(`Missing or invalid server environment variables:\n${formatted}`);
    }
    return { ...clientResult.data, ...serverResult.data };
  }

  return clientResult.data;
}

export const env = validateEnv();

// ── Type exports ─────────────────────────────────────────────────────────────
export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;
