import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all } = body as { notification_ids?: string[]; mark_all?: boolean };

    if (mark_all) {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);

        if (error) {
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
    } else if (notification_ids && notification_ids.length > 0) {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", user.id)
            .in("id", notification_ids);

        if (error) {
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
    } else {
        return NextResponse.json({ error: "Provide notification_ids or mark_all" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
