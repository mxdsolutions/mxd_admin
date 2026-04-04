import { redirect } from "next/navigation";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { PlatformAdminShell } from "./PlatformAdminShell";

export default async function PlatformAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isAdmin = await isPlatformAdmin();
    if (!isAdmin) {
        redirect("/dashboard");
    }

    return <PlatformAdminShell>{children}</PlatformAdminShell>;
}
