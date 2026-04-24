"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { setActiveTenant } from "@/lib/tenant";

export async function switchTenant(tenantId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const admin = await createAdminClient();
        const { data: membership } = await admin
            .from("tenant_memberships")
            .select("tenant_id")
            .eq("user_id", user.id)
            .eq("tenant_id", tenantId)
            .single();

        if (!membership) {
            return { success: false, error: "You are not a member of this workspace" };
        }

        await setActiveTenant(user.id, tenantId);

        // Refresh the session so the client's JWT claims reflect the new
        // active_tenant_id — otherwise middleware still reads the old tenant.
        await supabase.auth.refreshSession();

        revalidatePath("/", "layout");
        return { success: true };
    } catch (err) {
        console.error("[switchTenant] error:", err);
        return { success: false, error: err instanceof Error ? err.message : "Failed to switch workspace" };
    }
}
