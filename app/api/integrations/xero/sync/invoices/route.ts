import { NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/handler";
import { pullInvoicesFromXero } from "@/lib/xero-sync";

export const POST = withAuth(async (_request, { supabase, user, tenantId }) => {
    const { data: membership } = await supabase
        .from("tenant_memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .single();

    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
        return NextResponse.json(
            { error: "You do not have permission to sync Xero" },
            { status: 403 }
        );
    }

    const { data: connection } = await supabase
        .from("xero_connections")
        .select("last_sync_at, status")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .single();

    if (!connection) {
        return NextResponse.json(
            { error: "No active Xero connection" },
            { status: 400 }
        );
    }

    try {
        const result = await pullInvoicesFromXero(
            supabase,
            tenantId,
            user.id,
            connection.last_sync_at || undefined
        );

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Sync failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
});
