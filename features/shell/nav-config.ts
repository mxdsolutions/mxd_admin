import {
    Squares2X2Icon,
    UsersIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    FunnelIcon,
    RocketLaunchIcon,
    BuildingOffice2Icon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
    CogIcon,
    CubeIcon,
    LinkIcon,
    ShieldCheckIcon,
    CreditCardIcon,
    CalculatorIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
} from "@heroicons/react/24/outline";
import { ROUTES } from "@/lib/routes";

export type Workspace = "crm" | "operations" | "finance" | "settings";

export type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    moduleId?: string;
};

export type WorkspaceConfig = {
    id: Workspace;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export const WORKSPACES: WorkspaceConfig[] = [
    { id: "crm", label: "CRM", icon: UserGroupIcon },
    { id: "operations", label: "Operations", icon: BriefcaseIcon },
    { id: "finance", label: "Finance", icon: BanknotesIcon },
    { id: "settings", label: "Settings", icon: CogIcon },
];

export const OPERATIONS_ITEMS: NavItem[] = [
    { href: ROUTES.OPS_OVERVIEW, label: "Overview", icon: Squares2X2Icon, moduleId: "operations.overview" },
    { href: ROUTES.OPS_JOBS, label: "Jobs", icon: BriefcaseIcon, moduleId: "operations.jobs" },
    { href: ROUTES.OPS_PROJECTS, label: "Projects", icon: ClipboardDocumentListIcon, moduleId: "operations.projects" },
    { href: ROUTES.OPS_SERVICES, label: "Services", icon: CubeIcon, moduleId: "operations.services" },
    { href: ROUTES.OPS_REPORTS, label: "Reports", icon: DocumentTextIcon, moduleId: "operations.reports" },
];

export const FINANCE_ITEMS: NavItem[] = [
    { href: ROUTES.FINANCE_QUOTES, label: "Quotes", icon: CalculatorIcon, moduleId: "finance.quotes" },
    { href: ROUTES.FINANCE_INVOICES, label: "Invoices", icon: BanknotesIcon, moduleId: "finance.invoices" },
    { href: ROUTES.FINANCE_PRICING, label: "Pricing", icon: CurrencyDollarIcon, moduleId: "finance.pricing" },
];

export const CRM_ITEMS: NavItem[] = [
    { href: ROUTES.CRM_OVERVIEW, label: "Overview", icon: Squares2X2Icon, moduleId: "crm.overview" },
    { href: ROUTES.CRM_LEADS, label: "Leads", icon: FunnelIcon, moduleId: "crm.leads" },
    { href: ROUTES.CRM_OPPORTUNITIES, label: "Opportunities", icon: RocketLaunchIcon, moduleId: "crm.opportunities" },
    { href: ROUTES.CRM_COMPANIES, label: "Companies", icon: BuildingOffice2Icon, moduleId: "crm.companies" },
    { href: ROUTES.CRM_CONTACTS, label: "Contacts", icon: UserGroupIcon, moduleId: "crm.contacts" },
];

export function getSettingsItems(opts: {
    hasBrandingAccess: boolean;
    hasRolesAccess: boolean;
    hasDomainAccess: boolean;
}): NavItem[] {
    return [
        { href: ROUTES.SETTINGS_USERS, label: "Users", icon: UsersIcon },
        { href: ROUTES.SETTINGS_INTEGRATIONS, label: "Integrations", icon: LinkIcon },
        ...(opts.hasBrandingAccess || opts.hasDomainAccess ? [{ href: ROUTES.SETTINGS_COMPANY, label: "Company", icon: BuildingOffice2Icon }] : []),
        ...(opts.hasRolesAccess ? [{ href: ROUTES.SETTINGS_ROLES, label: "Roles & Permissions", icon: ShieldCheckIcon }] : []),
        ...(opts.hasDomainAccess ? [{ href: ROUTES.SETTINGS_SUBSCRIPTION, label: "Subscription", icon: CreditCardIcon }] : []),
    ];
}

export function getItemsForWorkspace(
    ws: Workspace,
    settingsItems: NavItem[]
): NavItem[] {
    switch (ws) {
        case "crm":
            return CRM_ITEMS;
        case "finance":
            return FINANCE_ITEMS;
        case "settings":
            return settingsItems;
        default:
            return OPERATIONS_ITEMS;
    }
}

export function getWorkspaceForPath(pathname: string): Workspace {
    if (pathname.startsWith("/dashboard/crm")) return "crm";
    if (pathname.startsWith("/dashboard/finance")) return "finance";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    return "operations";
}

/** Filter nav items by enabled modules. Items without a moduleId are always shown. */
export function filterItemsByModules(items: NavItem[], enabledModules: Set<string>): NavItem[] {
    return items.filter((item) => !item.moduleId || enabledModules.has(item.moduleId));
}
