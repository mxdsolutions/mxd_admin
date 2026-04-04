"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { usePageTitle } from "@/lib/page-title-context";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statLabelClass, statValueClass, cardGap } from "@/lib/design-system";
import {
    FunnelIcon,
    RocketLaunchIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useStats } from "@/lib/swr";
import { MetricsSkeleton } from "@/components/ui/skeleton";

const CrmPerformanceChart = dynamic(
    () => import("@/components/charts/CrmPerformanceChart"),
    {
        loading: () => <div className="h-[300px] animate-pulse bg-muted rounded-xl" />,
        ssr: false,
    }
);

const fadeInUp = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

type Stats = {
    totalLeads: number;
    totalOpportunities: number;
    pipelineValue: number;
    wonRevenueThisMonth: number;
    opportunityChart: { month: string; won: number; total: number }[];
};

export default function CrmOverview() {
    usePageTitle("CRM Overview");
    const { data, isLoading: loading } = useStats();
    const stats: Stats | null = data?.stats || null;

    const metrics = [
        {
            label: "Total Leads",
            value: stats?.totalLeads.toLocaleString() || "0",
            icon: FunnelIcon,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Total Opportunities",
            value: stats?.totalOpportunities.toLocaleString() || "0",
            icon: ChartBarIcon,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
        },
        {
            label: "Pipeline Value",
            value: stats ? `$${stats.pipelineValue.toLocaleString()}` : "$0",
            icon: RocketLaunchIcon,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        },
        {
            label: "Won Revenue This Month",
            value: stats ? `$${stats.wonRevenueThisMonth.toLocaleString()}` : "$0",
            icon: CurrencyDollarIcon,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
    ];

    return (
        <DashboardPage className="space-y-6">
            {/* 4 Stat Cards - all on one line */}
            {loading ? (
                <MetricsSkeleton count={4} />
            ) : (
                <motion.div variants={fadeInUp}>
                    <div className={cn(`grid grid-cols-2 lg:grid-cols-4 ${cardGap} px-4 md:px-6 lg:px-10`)}>
                        {metrics.map((metric, i) => (
                            <Card key={i} className="border-border shadow-none overflow-hidden rounded-2xl">
                                <CardContent className="p-4 md:p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={statLabelClass}>{metric.label}</span>
                                        <div className={`p-2 rounded-xl ${metric.bg}`}>
                                            <metric.icon className={`w-4 h-4 ${metric.color}`} />
                                        </div>
                                    </div>
                                    <h3 className={statValueClass}>{metric.value}</h3>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Monthly Performance Line Chart */}
            <motion.div variants={fadeInUp} className="px-4 md:px-6 lg:px-10">
                <Card className="border-border shadow-none rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-border/50 flex items-center justify-between">
                            <h2 className="text-sm font-bold tracking-tight">Monthly Performance</h2>
                            <span className="text-xs text-muted-foreground">Last 12 months</span>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="h-[300px] flex items-end gap-2 px-4">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="flex-1 bg-muted animate-pulse rounded-t" style={{ height: `${30 + Math.sin(i) * 30 + 20}%` }} />
                                    ))}
                                </div>
                            ) : (
                                <CrmPerformanceChart data={stats?.opportunityChart || []} />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </DashboardPage>
    );
}
