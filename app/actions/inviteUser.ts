"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validation";

export async function inviteUser(
    email: string,
    firstName: string,
    lastName: string,
    role: "admin" | "member"
) {
    const validated = forgotPasswordSchema.safeParse({ email });
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }

    try {
        const supabase = await createAdminClient();

        // Derive the base URL from the incoming request so invite links
        // point to localhost in dev and the real domain in production.
        const headersList = await headers();
        const host = headersList.get("host") || "localhost:3000";
        const protocol = host.startsWith("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}/`;

        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
                first_name: firstName,
                last_name: lastName,
                user_type: role,
            },
            redirectTo: `${baseUrl}auth/callback?next=/onboarding`,
        });

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, error: null, data };
    } catch (err: any) {
        return { success: false, error: err?.message || "Something went wrong" };
    }
}
