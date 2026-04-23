export type PermissionAction = "read" | "write" | "delete";

export type ResourceDefinition = {
    key: string;
    label: string;
    group: ResourceGroup;
    actions: PermissionAction[];
};

export const RESOURCE_GROUPS = [
    "CRM",
    "Operations",
    "Finance",
    "Settings",
    "Integrations",
] as const;

export type ResourceGroup = (typeof RESOURCE_GROUPS)[number];

export type RoleSlug = "owner" | "admin" | "manager" | "member" | "viewer";

export type RolePermissions = Record<
    string,
    { read?: boolean; write?: boolean; delete?: boolean }
>;

export const RESOURCES: ResourceDefinition[] = [
    // CRM
    { key: "crm.clients", label: "Clients", group: "CRM", actions: ["read", "write", "delete"] },

    // Operations
    { key: "ops.jobs", label: "Jobs", group: "Operations", actions: ["read", "write", "delete"] },
    { key: "ops.schedule", label: "Schedule", group: "Operations", actions: ["read", "write", "delete"] },
    { key: "ops.reports", label: "Reports", group: "Operations", actions: ["read", "write", "delete"] },
    { key: "ops.services", label: "Services", group: "Operations", actions: ["read", "write", "delete"] },

    // Finance
    { key: "finance.quotes", label: "Quotes", group: "Finance", actions: ["read", "write", "delete"] },
    { key: "finance.invoices", label: "Invoices", group: "Finance", actions: ["read", "write", "delete"] },
    { key: "finance.pricing", label: "Materials", group: "Finance", actions: ["read", "write", "delete"] },

    // Settings
    { key: "settings.users", label: "Users", group: "Settings", actions: ["read", "write", "delete"] },
    { key: "settings.roles", label: "Roles & Permissions", group: "Settings", actions: ["read", "write"] },
    { key: "settings.company", label: "Company", group: "Settings", actions: ["read", "write"] },
    { key: "settings.subscription", label: "Subscription", group: "Settings", actions: ["read", "write"] },

    // Integrations
    { key: "integrations.xero.connect", label: "Xero — Connect & Disconnect", group: "Integrations", actions: ["write"] },
    { key: "integrations.xero.sync", label: "Xero — Run Sync", group: "Integrations", actions: ["write"] },
    { key: "integrations.outlook.connect", label: "Outlook — Connect & Disconnect", group: "Integrations", actions: ["write"] },
];

export function getResourcesByGroup(): Record<ResourceGroup, ResourceDefinition[]> {
    const out = Object.fromEntries(
        RESOURCE_GROUPS.map((g) => [g, [] as ResourceDefinition[]])
    ) as Record<ResourceGroup, ResourceDefinition[]>;
    for (const resource of RESOURCES) out[resource.group].push(resource);
    return out;
}

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<RoleSlug, RolePermissions> = {
    owner: {
        "crm.clients": { read: true, write: true, delete: true },
        "ops.jobs": { read: true, write: true, delete: true },
        "ops.schedule": { read: true, write: true, delete: true },
        "ops.reports": { read: true, write: true, delete: true },
        "ops.services": { read: true, write: true, delete: true },
        "finance.quotes": { read: true, write: true, delete: true },
        "finance.invoices": { read: true, write: true, delete: true },
        "finance.pricing": { read: true, write: true, delete: true },
        "settings.users": { read: true, write: true, delete: true },
        "settings.roles": { read: true, write: true },
        "settings.company": { read: true, write: true },
        "settings.subscription": { read: true, write: true },
        "integrations.xero.connect": { write: true },
        "integrations.xero.sync": { write: true },
        "integrations.outlook.connect": { write: true },
    },
    admin: {
        "crm.clients": { read: true, write: true, delete: true },
        "ops.jobs": { read: true, write: true, delete: true },
        "ops.schedule": { read: true, write: true, delete: true },
        "ops.reports": { read: true, write: true, delete: true },
        "ops.services": { read: true, write: true, delete: true },
        "finance.quotes": { read: true, write: true, delete: true },
        "finance.invoices": { read: true, write: true, delete: true },
        "finance.pricing": { read: true, write: true, delete: true },
        "settings.users": { read: true, write: true, delete: true },
        "settings.company": { read: true, write: true },
        "settings.subscription": { read: true, write: true },
        "integrations.xero.connect": { write: true },
        "integrations.xero.sync": { write: true },
        "integrations.outlook.connect": { write: true },
    },
    manager: {
        "crm.clients": { read: true, write: true },
        "ops.jobs": { read: true, write: true },
        "ops.schedule": { read: true, write: true },
        "ops.reports": { read: true, write: true },
        "ops.services": { read: true },
        "finance.quotes": { read: true, write: true },
        "finance.invoices": { read: true, write: true },
        "finance.pricing": { read: true },
        "settings.users": { read: true },
        "settings.company": { read: true },
        "integrations.xero.sync": { write: true },
    },
    member: {
        "crm.clients": { read: true, write: true },
        "ops.jobs": { read: true, write: true },
        "ops.schedule": { read: true, write: true },
        "ops.reports": { read: true, write: true },
        "ops.services": { read: true },
        "finance.quotes": { read: true, write: true },
        "finance.invoices": { read: true },
        "finance.pricing": { read: true },
        "settings.company": { read: true },
    },
    viewer: {
        "crm.clients": { read: true },
        "ops.jobs": { read: true },
        "ops.schedule": { read: true },
        "ops.reports": { read: true },
        "ops.services": { read: true },
        "finance.quotes": { read: true },
        "finance.invoices": { read: true },
        "finance.pricing": { read: true },
    },
};
