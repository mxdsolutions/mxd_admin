import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PermissionAction } from "@/lib/permissions";

type RolePermissions = Record<
    string,
    { read?: boolean; write?: boolean; delete?: boolean }
>;

function resolve(
    permissions: RolePermissions,
    role: string,
    resource: string,
    action: PermissionAction
): boolean {
    if (role === "owner") return true;
    if (permissions[resource]?.[action]) return true;
    const parent = resource.split(".")[0];
    if (parent !== resource && permissions[parent]?.[action]) return true;
    return false;
}

/**
 * Gate an API route on a tenant-role permission. Returns `null` when the
 * request is allowed, or a 403/500 `NextResponse` the handler should return
 * as-is.
 *
 * ```ts
 * export const POST = withAuth(async (req, { supabase, user, tenantId }) => {
 *   const denied = await requirePermission(
 *     supabase, user.id, tenantId, "integrations.xero.sync", "write"
 *   );
 *   if (denied) return denied;
 *   // ... handler logic
 * });
 * ```
 *
 * Resolution rules: owner role bypasses the check; otherwise the specific
 * resource key is consulted first, falling back to its top-level prefix
 * (e.g. `crm.clients` -> `crm`) before denying.
 */
export async function requirePermission(
    supabase: SupabaseClient,
    userId: string,
    tenantId: string,
    resource: string,
    action: PermissionAction
): Promise<NextResponse | null> {
    const { data: membership, error: membershipError } = await supabase
        .from("tenant_memberships")
        .select("role")
        .eq("user_id", userId)
        .eq("tenant_id", tenantId)
        .single();

    if (membershipError || !membership) {
        return NextResponse.json(
            { error: "You do not belong to this workspace" },
            { status: 403 }
        );
    }

    const { data: roleRow, error: roleError } = await supabase
        .from("tenant_roles")
        .select("permissions")
        .eq("tenant_id", tenantId)
        .eq("slug", membership.role)
        .single();

    if (roleError || !roleRow) {
        return NextResponse.json(
            { error: "Role configuration missing for this workspace" },
            { status: 500 }
        );
    }

    const allowed = resolve(
        (roleRow.permissions as RolePermissions) || {},
        membership.role,
        resource,
        action
    );

    if (!allowed) {
        return NextResponse.json(
            { error: "You do not have permission to perform this action" },
            { status: 403 }
        );
    }

    return null;
}

/**
 * Hard owner-only gate. Used for capabilities that must never be granted to
 * non-owners regardless of what is stored in `tenant_roles.permissions` —
 * primarily the Roles & Permissions editor itself.
 */
export async function requireOwner(
    supabase: SupabaseClient,
    userId: string,
    tenantId: string
): Promise<NextResponse | null> {
    const { data: membership } = await supabase
        .from("tenant_memberships")
        .select("role")
        .eq("user_id", userId)
        .eq("tenant_id", tenantId)
        .single();

    if (!membership || membership.role !== "owner") {
        return NextResponse.json(
            { error: "Only the workspace owner can perform this action" },
            { status: 403 }
        );
    }

    return null;
}
