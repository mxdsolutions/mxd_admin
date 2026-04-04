export type TenantModule = {
    module_id: string;
    enabled: boolean;
};

export const DEFAULT_MODULES: TenantModule[] = [
    // Workspace-level
    { module_id: "crm", enabled: true },
    { module_id: "operations", enabled: true },
    { module_id: "finance", enabled: true },
    // CRM sub-modules
    { module_id: "crm.overview", enabled: true },
    { module_id: "crm.leads", enabled: true },
    { module_id: "crm.opportunities", enabled: true },
    { module_id: "crm.companies", enabled: true },
    { module_id: "crm.contacts", enabled: true },
    // Operations sub-modules
    { module_id: "operations.overview", enabled: true },
    { module_id: "operations.jobs", enabled: true },
    { module_id: "operations.projects", enabled: true },
    { module_id: "operations.services", enabled: true },
    { module_id: "operations.reports", enabled: true },
    // Finance sub-modules
    { module_id: "finance.quotes", enabled: true },
    { module_id: "finance.invoices", enabled: true },
    { module_id: "finance.pricing", enabled: true },
];

/** All known workspace-level module IDs */
export const WORKSPACE_MODULES = ["crm", "operations", "finance"] as const;

/** Build a Set of enabled module IDs from the modules array */
export function buildEnabledSet(modules: TenantModule[]): Set<string> {
    return new Set(modules.filter((m) => m.enabled).map((m) => m.module_id));
}

/** Derive a module ID from a dashboard route path, e.g. "/dashboard/crm/leads" -> "crm.leads" */
export function routeToModuleId(href: string): string | null {
    const match = href.match(/^\/dashboard\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return `${match[1]}.${match[2]}`;
}
