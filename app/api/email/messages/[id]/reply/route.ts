import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { graphFetch, OutlookReauthRequired } from "@/lib/microsoft-graph";
import { replyEmailSchema } from "@/lib/validation";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = replyEmailSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json(
            { error: "Validation failed", details: validation.error.flatten().fieldErrors },
            { status: 400 }
        );
    }
    const { comment } = validation.data;
    const to = Array.isArray(validation.data.to) ? validation.data.to : [];
    const cc = Array.isArray(validation.data.cc) ? validation.data.cc : [];
    if (to.length === 0) {
        return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    try {
        const draftRes = await graphFetch(supabase, user.id, `/me/messages/${id}/createReply`, {
            method: "POST",
        });
        if (!draftRes.ok) {
            const err = await draftRes.json();
            return NextResponse.json(
                { error: err.error?.message || "Failed to create reply" },
                { status: draftRes.status }
            );
        }
        const draft = await draftRes.json();
        const quoted = draft.body?.content || "";
        const merged = `<div>${comment}</div>${quoted}`;

        const patchRes = await graphFetch(supabase, user.id, `/me/messages/${draft.id}`, {
            method: "PATCH",
            body: JSON.stringify({
                toRecipients: to.map((address) => ({ emailAddress: { address } })),
                ccRecipients: cc.map((address) => ({ emailAddress: { address } })),
                body: { contentType: "HTML", content: merged },
            }),
        });
        if (!patchRes.ok) {
            const err = await patchRes.json();
            return NextResponse.json(
                { error: err.error?.message || "Failed to prepare reply" },
                { status: patchRes.status }
            );
        }

        const sendRes = await graphFetch(supabase, user.id, `/me/messages/${draft.id}/send`, {
            method: "POST",
        });
        if (!sendRes.ok) {
            const err = await sendRes.json();
            return NextResponse.json(
                { error: err.error?.message || "Failed to send reply" },
                { status: sendRes.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        if (err instanceof OutlookReauthRequired) {
            return NextResponse.json({ error: err.message, code: "OUTLOOK_REAUTH_REQUIRED" }, { status: 401 });
        }
        const message = err instanceof Error ? err.message : "Failed to send reply";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
