"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { onboardingSchema } from "@/lib/validation";

export async function completeOnboarding(formData: FormData) {
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;

    const validated = onboardingSchema.safeParse({ first_name, last_name });
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }

    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.updateUser({
            data: {
                first_name,
                last_name,
                full_name: `${first_name} ${last_name}`,
                onboarding_completed: true,
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }
    } catch (err: any) {
        if (err.message === "NEXT_REDIRECT") throw err;
        return { success: false, error: err.message || "An unexpected error occurred" };
    }

    redirect("/dashboard");
}
