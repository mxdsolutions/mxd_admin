-- ============================================================================
-- 003_tenant_config.sql
-- Dynamic status configs and modular workspaces per tenant
-- ============================================================================

-- ---------- tenant_status_configs ----------

CREATE TABLE tenant_status_configs (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type text NOT NULL CHECK (entity_type IN ('lead', 'opportunity', 'job')),
    statuses    jsonb NOT NULL DEFAULT '[]',
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now(),
    UNIQUE (tenant_id, entity_type)
);

CREATE INDEX idx_tenant_status_configs_lookup
    ON tenant_status_configs (tenant_id, entity_type);

ALTER TABLE tenant_status_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_status_configs_select" ON tenant_status_configs
    FOR SELECT TO authenticated
    USING (tenant_id = active_tenant_id());

CREATE POLICY "tenant_status_configs_insert" ON tenant_status_configs
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY "tenant_status_configs_update" ON tenant_status_configs
    FOR UPDATE TO authenticated
    USING (tenant_id = active_tenant_id())
    WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY "tenant_status_configs_delete" ON tenant_status_configs
    FOR DELETE TO authenticated
    USING (tenant_id = active_tenant_id());

-- ---------- tenant_modules ----------

CREATE TABLE tenant_modules (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_id   text NOT NULL,
    enabled     boolean NOT NULL DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now(),
    UNIQUE (tenant_id, module_id)
);

CREATE INDEX idx_tenant_modules_lookup
    ON tenant_modules (tenant_id);

ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_modules_select" ON tenant_modules
    FOR SELECT TO authenticated
    USING (tenant_id = active_tenant_id());

CREATE POLICY "tenant_modules_insert" ON tenant_modules
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY "tenant_modules_update" ON tenant_modules
    FOR UPDATE TO authenticated
    USING (tenant_id = active_tenant_id())
    WITH CHECK (tenant_id = active_tenant_id());

CREATE POLICY "tenant_modules_delete" ON tenant_modules
    FOR DELETE TO authenticated
    USING (tenant_id = active_tenant_id());

-- ---------- Seed existing tenants ----------

-- Lead statuses
INSERT INTO tenant_status_configs (tenant_id, entity_type, statuses)
SELECT id, 'lead', '[
    {"id":"new","label":"New","color":"bg-blue-500","is_default":true,"behaviors":[]},
    {"id":"contacted","label":"Contacted","color":"bg-amber-500","is_default":false,"behaviors":[]},
    {"id":"qualified","label":"Qualified","color":"bg-emerald-500","is_default":false,"behaviors":[]},
    {"id":"unqualified","label":"Unqualified","color":"bg-rose-400","is_default":false,"behaviors":[]},
    {"id":"converted","label":"Converted","color":"bg-violet-500","is_default":false,"behaviors":[]}
]'::jsonb
FROM tenants;

-- Opportunity stages
INSERT INTO tenant_status_configs (tenant_id, entity_type, statuses)
SELECT id, 'opportunity', '[
    {"id":"appt_booked","label":"Appt Booked","color":"bg-blue-500","is_default":true,"behaviors":[]},
    {"id":"proposal_sent","label":"Proposal Sent","color":"bg-amber-500","is_default":false,"behaviors":[]},
    {"id":"negotiation","label":"Negotiation","color":"bg-indigo-500","is_default":false,"behaviors":[]},
    {"id":"closed_won","label":"Closed Won","color":"bg-emerald-500","is_default":false,"behaviors":["trigger_job_creation"]},
    {"id":"closed_lost","label":"Closed Lost","color":"bg-rose-400","is_default":false,"behaviors":[]}
]'::jsonb
FROM tenants;

-- Job statuses
INSERT INTO tenant_status_configs (tenant_id, entity_type, statuses)
SELECT id, 'job', '[
    {"id":"new","label":"New","color":"bg-amber-500","is_default":true,"behaviors":[]},
    {"id":"in_progress","label":"In Progress","color":"bg-blue-500","is_default":false,"behaviors":[]},
    {"id":"completed","label":"Completed","color":"bg-emerald-500","is_default":false,"behaviors":[]},
    {"id":"cancelled","label":"Cancelled","color":"bg-rose-400","is_default":false,"behaviors":[]}
]'::jsonb
FROM tenants;

-- Default modules for all existing tenants
INSERT INTO tenant_modules (tenant_id, module_id, enabled)
SELECT t.id, m.module_id, true
FROM tenants t
CROSS JOIN (
    VALUES
        ('crm'), ('operations'), ('finance'),
        ('crm.overview'), ('crm.leads'), ('crm.opportunities'), ('crm.companies'), ('crm.contacts'),
        ('operations.overview'), ('operations.jobs'), ('operations.projects'), ('operations.services'), ('operations.reports'),
        ('finance.quotes'), ('finance.invoices'), ('finance.pricing')
) AS m(module_id);
