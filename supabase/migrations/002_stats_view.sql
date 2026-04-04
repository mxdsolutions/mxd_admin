-- get_tenant_stats: Returns core dashboard metrics for a tenant in a single query.
-- Chart data (monthly opportunity breakdown) and recent transactions/active jobs
-- are still fetched separately since they involve more complex time-series logic.

CREATE OR REPLACE FUNCTION get_tenant_stats(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH
    user_stats AS (
      SELECT
        count(*) AS total_users,
        count(*) FILTER (WHERE p.created_at >= now() - interval '30 days') AS new_users
      FROM profiles p
      JOIN tenant_memberships tm ON tm.user_id = p.id AND tm.tenant_id = p_tenant_id
    ),
    project_stats AS (
      SELECT
        count(*) AS total_projects,
        count(*) FILTER (WHERE status != 'completed') AS active_projects
      FROM projects WHERE tenant_id = p_tenant_id
    ),
    job_stats AS (
      SELECT
        count(*) AS total_jobs,
        count(*) FILTER (WHERE status NOT IN ('Completed','Cancelled','cancelled','completed')) AS active_jobs,
        coalesce(sum(amount) FILTER (WHERE status IN ('completed','Completed')), 0) AS total_revenue
      FROM jobs WHERE tenant_id = p_tenant_id
    ),
    lead_stats AS (
      SELECT
        count(*) AS total_leads,
        count(*) FILTER (WHERE status NOT IN ('converted','unqualified')) AS open_leads
      FROM leads WHERE tenant_id = p_tenant_id
    ),
    opp_stats AS (
      SELECT
        count(*) AS total_opportunities,
        coalesce(sum(value) FILTER (WHERE stage NOT IN ('closed_won','closed_lost')), 0) AS pipeline_value,
        coalesce(sum(value) FILTER (WHERE stage = 'closed_won' AND updated_at >= date_trunc('month', now())), 0) AS won_revenue_this_month
      FROM opportunities WHERE tenant_id = p_tenant_id
    ),
    company_stats AS (
      SELECT count(*) AS total_companies FROM companies WHERE tenant_id = p_tenant_id
    ),
    contact_stats AS (
      SELECT count(*) AS total_contacts FROM contacts WHERE tenant_id = p_tenant_id
    )
  SELECT jsonb_build_object(
    'totalUsers', (SELECT total_users FROM user_stats),
    'newUsers', (SELECT new_users FROM user_stats),
    'totalProjects', (SELECT total_projects FROM project_stats),
    'activeProjects', (SELECT active_projects FROM project_stats),
    'totalJobs', (SELECT total_jobs FROM job_stats),
    'activeJobs', (SELECT active_jobs FROM job_stats),
    'totalRevenue', (SELECT total_revenue FROM job_stats),
    'totalLeads', (SELECT total_leads FROM lead_stats),
    'openLeads', (SELECT open_leads FROM lead_stats),
    'totalOpportunities', (SELECT total_opportunities FROM opp_stats),
    'pipelineValue', (SELECT pipeline_value FROM opp_stats),
    'wonRevenueThisMonth', (SELECT won_revenue_this_month FROM opp_stats),
    'totalCompanies', (SELECT total_companies FROM company_stats),
    'totalContacts', (SELECT total_contacts FROM contact_stats)
  ) INTO result;

  RETURN result;
END;
$$;
