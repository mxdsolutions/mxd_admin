import {
    ChartBarIcon,
    BuildingOffice2Icon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

export type PlatformAdminNavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export const PLATFORM_ADMIN_NAV: PlatformAdminNavItem[] = [
    { href: "/platform-admin/dashboard", label: "Dashboard", icon: ChartBarIcon },
    { href: "/platform-admin/tenants", label: "Tenants", icon: BuildingOffice2Icon },
    { href: "/platform-admin/report-templates", label: "Report Templates", icon: DocumentTextIcon },
];
