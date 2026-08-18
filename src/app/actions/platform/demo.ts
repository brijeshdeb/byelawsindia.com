"use server";
/**
 * Platform-admin server actions for DEMO environment management.
 *
 * These actions are ONLY callable by platform administrators.
 * They operate via the admin Supabase client (service role) because they
 * modify data across tenant boundaries and bypass RLS by design.
 *
 * Security:
 *   - Every action verifies `is_platform_admin = true` on the caller's profile
 *     as the FIRST operation before touching any data.
 *   - The underlying SQL function (reset_demo_society) independently verifies
 *     environment_type = 'DEMO' before modifying anything.
 *   - The admin client (service role key) is server-only; it never reaches
 *     the browser.
 */
import { wrapAction, type ActionResult } from "@/lib/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function resetDemoDataAction(
  societyId: string
): Promise<ActionResult<{ message: string }>> {
  return wrapAction(async () => {
    // ── 1. Verify caller is a platform admin ─────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_platform_admin) {
      throw new Error("Forbidden: platform administrator access required.");
    }

    // ── 2. Verify the target is a DEMO society ────────────────────────────────
    const { data: society } = await supabase
      .from("societies")
      .select("id, name, environment_type")
      .eq("id", societyId)
      .single();

    if (!society) throw new Error("Society not found.");
    if (society.environment_type !== "DEMO") {
      throw new Error(
        `Refused: society "${society.name}" is a ${society.environment_type} environment. ` +
          "Reset is only allowed for DEMO environments."
      );
    }

    // ── 3. Call the reset SQL function via admin client ───────────────────────
    // The function handles all deletes and re-seeds atomically.
    const admin = createAdminClient();
    const { error } = await admin.rpc("reset_demo_society", {
      p_society_id: societyId,
    });

    if (error) {
      throw new Error(`Reset failed: ${error.message}`);
    }

    // ── 4. Write audit record ─────────────────────────────────────────────────
    // Use the admin client so the audit row survives even if the caller's
    // session cookie is stale after the reset wipes the audit log.
    await admin.from("audit_logs").insert({
      society_id: societyId,
      actor_user_id: user.id,
      action: "DEMO_DATA_RESET",
      entity_type: "society",
      entity_id: societyId,
      new_values: {
        environment_type: "DEMO",
        reset_by: user.id,
        reset_at: new Date().toISOString(),
      },
    });

    // ── 5. Invalidate cached pages that show demo data ────────────────────────
    revalidatePath("/finance");
    revalidatePath("/finance/dues");
    revalidatePath("/finance/payments");
    revalidatePath("/documents");
    revalidatePath("/maintenance");
    revalidatePath("/procurement");
    revalidatePath("/admin/console");

    return {
      message: `Demo data for "${society.name}" has been reset to the original seeded state.`,
    };
  });
}
