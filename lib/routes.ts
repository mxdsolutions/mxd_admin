export const ROUTES = {
    // CRM
    CRM_OVERVIEW: "/dashboard/crm/overview",
    CRM_LEADS: "/dashboard/crm/leads",
    CRM_OPPORTUNITIES: "/dashboard/crm/opportunities",
    CRM_COMPANIES: "/dashboard/crm/companies",
    CRM_CONTACTS: "/dashboard/crm/contacts",
    CRM_EMAILS: "/dashboard/crm/emails",

    // Operations
    OPS_OVERVIEW: "/dashboard/operations/overview",
    OPS_JOBS: "/dashboard/operations/jobs",
    OPS_PROJECTS: "/dashboard/operations/projects",
    OPS_SERVICES: "/dashboard/operations/services",
    OPS_REPORTS: "/dashboard/operations/reports",

    // Finance
    FINANCE_QUOTES: "/dashboard/finance/quotes",
    FINANCE_INVOICES: "/dashboard/finance/invoices",
    FINANCE_PRICING: "/dashboard/finance/pricing",

    // Settings
    SETTINGS_USERS: "/dashboard/settings/users",
    SETTINGS_INTEGRATIONS: "/dashboard/settings/integrations",
    SETTINGS_COMPANY: "/dashboard/settings/company",
    SETTINGS_ROLES: "/dashboard/settings/roles",
    SETTINGS_SUBSCRIPTION: "/dashboard/settings/subscription",
    SETTINGS_PROFILE: "/dashboard/settings/settings",

    // Platform Admin
    PLATFORM_ADMIN: "/platform-admin",

    // Auth
    LOGIN: "/",
    SIGNUP: "/signup",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    ONBOARDING: "/onboarding",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
