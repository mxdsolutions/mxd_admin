-- ============================================================================
-- 001_enable_rls.sql
-- Enable Row Level Security on all tables and create tenant-isolation policies
-- ============================================================================
--
-- NOTE: The service_role key bypasses RLS entirely. All server-side admin
-- operations (e.g. withPlatformAuth using createAdminClient) rely on this
-- built-in Supabase behaviour and do not need explicit policies.
--
-- Tenant resolution: every authenticated user's JWT contains
--   app_metadata.active_tenant_id
-- which is cast to UUID and matched against each row's tenant_id column.
-- ============================================================================

-- Helper: extract the caller's active tenant from JWT claims
-- Usage in policies: tenant_id = active_tenant_id()
CREATE OR REPLACE FUNCTION active_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt()->'app_metadata'->>'active_tenant_id')::uuid;
$$;


-- ============================================================================
-- TENANT-SCOPED TABLES
-- ============================================================================

-- ---------- leads ----------
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "leads_select" ON leads
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "leads_insert" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "leads_update" ON leads
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "leads_delete" ON leads
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- contacts ----------
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "contacts_select" ON contacts
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "contacts_insert" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "contacts_update" ON contacts
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "contacts_delete" ON contacts
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- companies ----------
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "companies_select" ON companies
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "companies_insert" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "companies_update" ON companies
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "companies_delete" ON companies
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- opportunities ----------
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "opportunities_select" ON opportunities
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "opportunities_insert" ON opportunities
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "opportunities_update" ON opportunities
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "opportunities_delete" ON opportunities
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- jobs ----------
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "jobs_select" ON jobs
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "jobs_insert" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "jobs_update" ON jobs
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "jobs_delete" ON jobs
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- job_assignees ----------
ALTER TABLE job_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "job_assignees_select" ON job_assignees
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "job_assignees_insert" ON job_assignees
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "job_assignees_update" ON job_assignees
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "job_assignees_delete" ON job_assignees
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- quotes ----------
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "quotes_select" ON quotes
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "quotes_insert" ON quotes
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "quotes_update" ON quotes
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "quotes_delete" ON quotes
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- quote_line_items ----------
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "quote_line_items_select" ON quote_line_items
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "quote_line_items_insert" ON quote_line_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "quote_line_items_update" ON quote_line_items
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "quote_line_items_delete" ON quote_line_items
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- invoices ----------
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "invoices_select" ON invoices
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "invoices_insert" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "invoices_update" ON invoices
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "invoices_delete" ON invoices
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- invoice_line_items ----------
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "invoice_line_items_select" ON invoice_line_items
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "invoice_line_items_insert" ON invoice_line_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "invoice_line_items_update" ON invoice_line_items
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "invoice_line_items_delete" ON invoice_line_items
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- projects ----------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "projects_delete" ON projects
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- notes ----------
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "notes_select" ON notes
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "notes_insert" ON notes
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "notes_update" ON notes
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "notes_delete" ON notes
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- notifications ----------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tenant-level isolation
CREATE POLICY IF NOT EXISTS "notifications_select" ON notifications
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id() AND user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "notifications_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id() AND user_id = auth.uid())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "notifications_delete" ON notifications
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id() AND user_id = auth.uid());


-- ---------- products (services) ----------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "products_select" ON products
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "products_insert" ON products
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "products_update" ON products
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "products_delete" ON products
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- pricing ----------
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "pricing_select" ON pricing
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "pricing_insert" ON pricing
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "pricing_update" ON pricing
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "pricing_delete" ON pricing
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- reports ----------
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "reports_select" ON reports
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "reports_insert" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "reports_update" ON reports
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "reports_delete" ON reports
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- tenant_memberships ----------
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "tenant_memberships_select" ON tenant_memberships
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_memberships_insert" ON tenant_memberships
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_memberships_update" ON tenant_memberships
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_memberships_delete" ON tenant_memberships
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- tenant_roles ----------
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "tenant_roles_select" ON tenant_roles
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_roles_insert" ON tenant_roles
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_roles_update" ON tenant_roles
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_roles_delete" ON tenant_roles
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- tenant_licenses ----------
ALTER TABLE tenant_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "tenant_licenses_select" ON tenant_licenses
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_licenses_insert" ON tenant_licenses
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_licenses_update" ON tenant_licenses
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_licenses_delete" ON tenant_licenses
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ---------- tenant_invites ----------
ALTER TABLE tenant_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "tenant_invites_select" ON tenant_invites
  FOR SELECT TO authenticated
  USING (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_invites_insert" ON tenant_invites
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_invites_update" ON tenant_invites
  FOR UPDATE TO authenticated
  USING (tenant_id = active_tenant_id())
  WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY IF NOT EXISTS "tenant_invites_delete" ON tenant_invites
  FOR DELETE TO authenticated
  USING (tenant_id = active_tenant_id());


-- ============================================================================
-- USER-SCOPED TABLES
-- ============================================================================

-- ---------- profiles ----------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow reading profiles of fellow tenant members (for avatars, names, etc.)
-- This joins through tenant_memberships to verify both users share a tenant.
CREATE POLICY IF NOT EXISTS "profiles_select_tenant_members" ON profiles
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT tm.user_id
      FROM tenant_memberships tm
      WHERE tm.tenant_id = active_tenant_id()
    )
  );
