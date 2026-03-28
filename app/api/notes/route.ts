import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { noteSchema } from "@/lib/validation";

export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");

    if (!entityType || !entityId) {
        return NextResponse.json({ error: "Missing entity_type or entity_id" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Resolve author names from profiles
    const userIds = [...new Set((data || []).map(n => n.created_by).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);
        profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name || p.email || "Unknown"]));
    }

    const notes = (data || []).map(n => ({
        ...n,
        author: n.created_by ? { id: n.created_by, full_name: profileMap[n.created_by] || "Unknown" } : null,
    }));

    return NextResponse.json({ notes });
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = noteSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { entity_type, entity_id, content, mentioned_user_ids } = validation.data;

    const { data, error } = await supabase
        .from("notes")
        .insert({ entity_type, entity_id, content, created_by: user.id })
        .select("*")
        .single();

    if (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Resolve author name
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", user.id)
        .single();

    const authorName = profile?.full_name || profile?.email || "Someone";

    // Create notifications for mentioned users
    if (mentioned_user_ids && mentioned_user_ids.length > 0) {
        const uniqueMentions = [...new Set(mentioned_user_ids)].filter(id => id !== user.id);
        if (uniqueMentions.length > 0) {
            const notifications = uniqueMentions.map(userId => ({
                user_id: userId,
                type: "mention",
                title: `${authorName} mentioned you in a note`,
                body: content.length > 120 ? content.slice(0, 120) + "..." : content,
                entity_type,
                entity_id,
                note_id: data.id,
                created_by: user.id,
            }));
            await supabase.from("notifications").insert(notifications);
        }
    }

    return NextResponse.json({
        note: {
            ...data,
            author: profile ? { id: profile.id, full_name: profile.full_name || profile.email || "Unknown" } : null,
        }
    }, { status: 201 });
}
