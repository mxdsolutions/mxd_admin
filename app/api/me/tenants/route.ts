import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type TenantMembershipRow = {
    role: string;
    tenants: {
        id: string;
        name: string;
        slug: string;
        company_name: string | null;
        logo_url: string | null;
        status: string;
    } | null;
};

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await createAdminClient();
    const { data, error } = await admin
        .from("tenant_memberships")
        .select("role, tenants:tenant_id(id, name, slug, company_name, logo_url, status)")
        .eq("user_id", user.id);

    if (error) {
        console.error("Failed to fetch user tenants:", error);
        return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
    }

    const rows = (data || []) as unknown as TenantMembershipRow[];
    const tenants = rows
        .filter((row) => row.tenants && row.tenants.status === "active")
        .map((row) => ({
            id: row.tenants!.id,
            name: row.tenants!.name,
            slug: row.tenants!.slug,
            company_name: row.tenants!.company_name,
            logo_url: row.tenants!.logo_url,
            role: row.role,
        }));

    const activeTenantId = (user.app_metadata?.active_tenant_id as string | undefined) ?? null;

    return NextResponse.json({ tenants, active_tenant_id: activeTenantId });
}
