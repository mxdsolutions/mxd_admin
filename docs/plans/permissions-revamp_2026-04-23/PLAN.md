# Permissions Revamp

**Date:** 2026-04-23
**Author:** Dylan
**Status:** approved

---

## Goal

Replace the current partially-implemented permissions model with one that is (a) tied directly to the app's sidebar structure and (b) consistently enforced on both the UI and the API. Also introduce dedicated toggles for integration-level operations (Xero connect/disconnect/sync) that don't map to a sidebar item.

The editing experience for this lives in **Settings → Users → Roles & Permissions**, where an owner/admin can pick a role and tick read/write/delete on each resource.

## Why now

- The existing `permissions` JSONB on the tenant context is there but not wired through the UI, so it drifts.
- The Xero integration work exposed that mutation endpoints (sync, disconnect) had zero role enforcement — we just patched it inline with an ad-hoc `["owner", "admin"]` check. That pattern will proliferate.
- Adding more integrations (Stripe, Slack, etc.) will keep multiplying ad-hoc checks unless we centralize.

## Approach

### 1. Define the resource model

Since the app doesn't have formal "resource groups", we model permissions **1:1 with sidebar items** plus a small number of non-nav resources for cross-cutting concerns.

Each resource supports three actions: `read`, `write`, `delete`.
- `read` → user can see the page and fetch records
- `write` → user can create and edit records
- `delete` → user can archive/soft-delete records

### 2. Resource list (v1)

Derived from `features/shell/nav-config.ts` and `lib/routes.ts`:

**Nav resources (sidebar items):**
| Resource key | Sidebar label |
|---|---|
| `overview` | Overview |
| `analytics` | Analytics |
| `crm.clients` | Clients |
| `ops.jobs` | Jobs |
| `ops.schedule` | Schedule |
| `ops.reports` | Reports |
| `ops.services` | Services |
| `finance.quotes` | Quotes |
| `finance.invoices` | Invoices |
| `finance.pricing` | Materials |

**Settings resources (shown in settings, not main sidebar):**
| Resource key | Description |
|---|---|
| `settings.users` | Invite / remove users |
| `settings.users.roles` | Edit roles & permissions (always owner-only) |
| `settings.company` | Company profile, branding |
| `settings.subscription` | Billing, plan changes |

**Integration resources (non-nav):**
| Resource key | Description |
|---|---|
| `integrations.xero.connect` | Connect / disconnect / select-tenant |
| `integrations.xero.sync` | Trigger contacts / invoices sync |
| `integrations.outlook.connect` | Connect / disconnect Outlook |

For integrations only `write` is meaningful — read is implicit (if you can see the settings page you can see status).

### 3. Storage

Add a `permissions` JSONB column on `tenant_roles` (already exists as a table per `lib/tenant-context.tsx`). Shape:

```json
{
  "crm.clients":         { "read": true,  "write": true,  "delete": false },
  "ops.jobs":            { "read": true,  "write": true,  "delete": false },
  "finance.invoices":    { "read": true,  "write": false, "delete": false },
  "integrations.xero.sync":    { "write": true },
  "integrations.xero.connect": { "write": false }
}
```

Seed sensible defaults for `owner` (everything), `admin` (everything except `settings.users.roles`), `manager` (all nav + `integrations.xero.sync`), `member` (read everything + write on operational resources), `viewer` (read only).

`settings.users.roles` is always owner-only regardless of what the UI shows — hard-coded at the API layer as a safety net.

### 4. Enforcement seams

**API layer**

Introduce `app/api/_lib/permissions.ts`:

```ts
export async function requirePermission(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string,
  resource: string,
  action: "read" | "write" | "delete"
): Promise<{ ok: true } | { ok: false; response: NextResponse }>
```

Route handlers wrap mutations in a single call. Replaces the inline `["owner", "admin"]` checks that now exist in the Xero routes.

**UI layer**

- Sidebar uses `usePermission(resource, "read")` to hide items the user can't access.
- Action buttons (e.g. "Add Contact", "Sync Now") use `usePermission(resource, "write")` to hide themselves.
- Route-level guard in `app/dashboard/layout.tsx` (or per-page) redirects to Overview if the user hits a page without `read`.

**Existing `resolvePermission` logic** (specific → parent → deny) stays — it's already there and works.

### 5. Settings UI

New page (or enhancement of existing) at `/dashboard/settings/users/roles`:

- Left column: list of roles (Owner, Admin, Manager, Member, Viewer, + custom roles if we support them later).
- Right column: resource × action grid for the selected role.
- Grouped by section (CRM, Operations, Finance, Settings, Integrations) to avoid a wall of checkboxes.
- Owner role is read-only (always has everything).
- Save persists JSONB to `tenant_roles.permissions`.

### 6. Migration

- Add `permissions` column to `tenant_roles` (JSONB, default `{}`).
- Backfill default permission sets per role for all existing tenants.
- Remove the ad-hoc `["owner", "admin"]` checks in the Xero integration routes and replace with `requirePermission(..., "integrations.xero.connect", "write")` etc.

## Key Decisions

- **Granularity = sidebar items + integrations**, not individual fields or entities. Fewer toggles, easier to reason about.
- **Role-based, not user-based.** Users get a role, roles carry permissions. No per-user overrides in v1.
- **JSONB storage**, not a normalized permissions table. Simpler queries; permissions are inherently sparse and hierarchical.
- **Settings UI lives under Users**, not a standalone "Permissions" section — users come from settings, roles govern users, permissions govern roles.

## Resolved Decisions

- **Roles:** fixed five (owner, admin, manager, member, viewer) for v1. Custom roles can come later if needed.
- **Actions:** keep `read`, `write`, `delete` as separate toggles. "Delete" maps to the soft-archive action in this codebase (no hard deletes exist) — treating it as its own permission makes the UI intent clearer and lets us gate archive separately from edit.
- **Subscription write:** owner + admin can modify the subscription. All other roles are read-only or no access.

## Open Questions

- None outstanding — ready for Phase 1.
