/**
 * Server-side session context helpers.
 *
 * Lightweight wrappers that read the context cookie (set after login) and
 * return enough information for server actions and server components to:
 *   1. Know which society (and optional wing) the user selected.
 *   2. Call Supabase with the user's authenticated session.
 *
 * These helpers do NOT load permissions — call resolveUserContext() from
 * AccessService when you need full permission enforcement.
 */
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CONTEXT_COOKIE } from "@/server/services/AccessService";
import { AppError } from "@/types";

export interface ServerContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  societyId: string;
  wingId: string | null;
}

/**
 * Reads the selected context cookie + validates an active Supabase session.
 * Throws UNAUTHORIZED if either is missing.
 *
 * Use this at the start of every server action that touches tenant data.
 */
export async function getServerContext(): Promise<ServerContext> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONTEXT_COOKIE)?.value;

  if (!raw) throw AppError.unauthorized("No active context. Please log in.");

  let parsed: { societyId: string; wingId: string | null };
  try {
    parsed = JSON.parse(raw) as { societyId: string; wingId: string | null };
  } catch {
    throw AppError.unauthorized("Invalid context cookie.");
  }

  const { societyId, wingId } = parsed;
  if (!societyId) throw AppError.unauthorized("Context cookie is missing societyId.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw AppError.unauthorized("Not authenticated.");

  return { supabase, userId: user.id, societyId, wingId: wingId ?? null };
}

/**
 * Generates the next formatted sequence number for a domain entity.
 * e.g. nextSequenceNumber(supabase, societyId, 'MEMBER') => 'MBR-2026-001'
 *
 * Uses the get_next_sequence() DB function (security definer — safe to call
 * from any authenticated user's session).
 */
export async function nextSequenceNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  societyId: string,
  sequenceType: string,
  prefix: string,
  wingCode?: string | null
): Promise<string> {
  const year = new Date().getFullYear();

  const { data, error } = await supabase.rpc("get_next_sequence", {
    p_society_id: societyId,
    p_sequence_type: sequenceType,
    p_year: year,
    p_wing_code: wingCode ?? null,
  });

  if (error || data === null) {
    // Fallback: use a timestamp-based number that won't clash
    return `${prefix}-${year}-${Date.now().toString().slice(-5)}`;
  }

  return `${prefix}-${year}-${String(data).padStart(3, "0")}`;
}

/**
 * Wraps a server action body, converting AppError and unexpected errors
 * to a consistent { success, error } shape so Client Components can
 * display errors without crashing.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function wrapAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof AppError) {
      return { success: false, error: err.message };
    }
    console.error("[server-action]", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
