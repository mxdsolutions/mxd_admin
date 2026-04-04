import { createClient } from "@/lib/supabase/server";

/**
 * Check if the current authenticated user is a platform admin.
 * Reads from app_metadata which cannot be self-modified by users.
 */
export async function isPlatformAdmin(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.app_metadata?.is_platform_admin === true;
}

/**
 * Check if a user object has platform admin privileges.
 * Use this when you already have the user object available.
 */
export function isPlatformAdminUser(user: { app_metadata?: Record<string, unknown> }): boolean {
    return user?.app_metadata?.is_platform_admin === true;
}
