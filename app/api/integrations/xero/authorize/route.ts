import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";
import { buildXeroAuthUrl } from "@/lib/xero";
import { v4 as uuid } from "uuid";

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { data: membership } = await supabase
        .from("tenant_memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
        return NextResponse.json(
            { error: "Only owners and admins can connect Xero" },
            { status: 403 }
        );
    }

    const state = uuid();
    const cookieStore = await cookies();
    cookieStore.set("xero_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });

    const authUrl = buildXeroAuthUrl(state);
    return NextResponse.redirect(authUrl);
}
