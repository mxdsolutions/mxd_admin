import { NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/handler";
import { DEFAULT_MODULES } from "@/lib/module-config";

export const GET = withAuth(async (_request, { supabase, tenantId }) => {
    const { data, error } = await supabase
        .from("tenant_modules")
        .select("module_id, enabled")
        .eq("tenant_id", tenantId);

    if (error || !data || data.length === 0) {
        // Fall back to defaults if no module config exists
        return NextResponse.json({ modules: DEFAULT_MODULES });
    }

    return NextResponse.json({ modules: data });
});
