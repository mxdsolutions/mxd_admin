# Database Schema

> This document provides an overview of the database schema. For full column details, query the Supabase dashboard or run `\d+ table_name` against the database.

## Core Tables

### Tenants & Auth
| Table | Purpose |
|-------|---------|
| `tenants` | Tenant organizations (name, slug, plan, branding) |
| `tenant_memberships` | User ↔ tenant associations with roles |
| `tenant_roles` | Custom role definitions with permission JSON |
| `tenant_invites` | Pending user invitations |
| `tenant_licenses` | Tenant license/subscription records |
| `profiles` | User profiles (synced from auth.users) |

### CRM
| Table | Purpose |
|-------|---------|
| `leads` | Sales leads with status pipeline |
| `contacts` | People (linked to companies) |
| `companies` | Organizations |
| `opportunities` | Deals with stage pipeline and value |

### Operations
| Table | Purpose |
|-------|---------|
| `jobs` | Service jobs with scheduling and payment tracking |
| `job_assignees` | Many-to-many job ↔ user assignments |
| `projects` | Project groupings for jobs |
| `products` | Services/products catalog |
| `reports` | Field reports (inspection, safety, etc.) |
| `report_templates` | Platform-managed report templates |

### Finance
| Table | Purpose |
|-------|---------|
| `quotes` | Quotes with margins and line items |
| `quote_line_items` | Individual items on a quote |
| `invoices` | Invoices with GST handling |
| `invoice_line_items` | Individual items on an invoice |
| `pricing` | Pricing matrix for materials/labour |

### Shared
| Table | Purpose |
|-------|---------|
| `notes` | Polymorphic notes (entity_type + entity_id) |
| `notifications` | User notifications with read status |

## Key Relationships

- All tenant-scoped tables have a `tenant_id` FK → `tenants.id`
- `leads` → `contacts`, `companies` (optional FKs)
- `opportunities` → `leads`, `contacts`, `companies` (optional FKs)
- `jobs` → `projects`, `opportunities`, `companies` (optional FKs)
- `quotes`/`invoices` → `companies`, `contacts` (optional FKs)
- `notes` → any entity via `entity_type` + `entity_id` (polymorphic)
- `profiles.id` = `auth.users.id` (1:1, populated by trigger)

## Row Level Security

RLS is enabled on all tables. Policies enforce:
- Tenant isolation: `tenant_id = active_tenant_id()` from JWT claims
- User isolation for `profiles`: `id = auth.uid()`
- User isolation for `notifications`: `user_id = auth.uid()`

See `supabase/migrations/001_enable_rls.sql` for full policy definitions.
