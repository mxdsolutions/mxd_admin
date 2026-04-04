import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withAuth } from "@/app/api/_lib/handler";

// A PostgreSQL function get_tenant_stats(p_tenant_id uuid) exists in
// supabase/migrations/002_stats_view.sql that calculates all of the count/sum
// metrics below in a single query using conditional aggregation.
// TODO: Replace with get_tenant_stats() RPC call when migration is deployed

export const GET = withAuth(async (_request, { supabase, tenantId }) => {
    const now = new Date();

    // Core stats via single RPC call (replaces 14 individual queries)
    // recentTransactions, activeJobs, and chartData are still fetched separately
    const [
        statsResult,
        recentTransactionsResult,
        activeJobsResult,
        chartData,
    ] = await Promise.all([
        supabase.rpc("get_tenant_stats", { p_tenant_id: tenantId }),
        supabase.from("jobs").select(`id, amount, status, updated_at, project:projects(title), assigned_to:profiles!jobs_assigned_to_fkey(full_name)`).order("updated_at", { ascending: false }).limit(5),
        supabase.from("jobs").select(`id, description, amount, status, scheduled_date, project:projects(title), assigned_to:profiles!jobs_assigned_to_fkey(full_name)`).not("status", "in", '("Completed","Cancelled","cancelled","completed")').order("scheduled_date", { ascending: true }).limit(10),
        buildChartData(supabase, now),
    ]);

    const coreStats = statsResult.data || {};

    return NextResponse.json({
        stats: {
            totalUsers: coreStats.totalUsers || 0,
            newUsers: coreStats.newUsers || 0,
            activeProjects: coreStats.activeProjects || 0,
            totalProjects: coreStats.totalProjects || 0,
            activeJobs: coreStats.activeJobs || 0,
            totalJobs: coreStats.totalJobs || 0,
            totalRevenue: coreStats.totalRevenue || 0,
            openLeads: coreStats.openLeads || 0,
            totalLeads: coreStats.totalLeads || 0,
            totalOpportunities: coreStats.totalOpportunities || 0,
            pipelineValue: coreStats.pipelineValue || 0,
            wonRevenueThisMonth: coreStats.wonRevenueThisMonth || 0,
            totalCompanies: coreStats.totalCompanies || 0,
            totalContacts: coreStats.totalContacts || 0,
            opportunityChart: chartData,
        },
        recentTransactions: (recentTransactionsResult.data || []).map(t => ({
            id: t.id,
            user: t.assigned_to ? (t.assigned_to as unknown as { full_name: string })?.full_name : "System",
            action: `Job: ${t.project ? (t.project as unknown as { title: string })?.title : "Untitled Project"}`,
            amount: `$${((t.amount as number) || 0).toFixed(2)}`,
            status: t.status || "Unknown",
            date: t.updated_at ? new Date(t.updated_at).toLocaleDateString() : "Just now"
        })),
        activeJobs: (activeJobsResult.data || []).map(j => ({
            id: j.id,
            description: j.description,
            project: j.project ? (j.project as unknown as { title: string })?.title : null,
            assignedTo: j.assigned_to ? (j.assigned_to as unknown as { full_name: string })?.full_name : null,
            amount: j.amount || 0,
            status: j.status || "Unknown",
            scheduledDate: j.scheduled_date,
        }))
    });
});

async function buildChartData(supabase: SupabaseClient, now: Date) {
    const months: { start: string; end: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            start: d.toISOString(),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
            label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        });
    }

    const queries = months.flatMap(m => [
        supabase.from("opportunities").select("*", { count: "exact", head: true }).gte("created_at", m.start).lt("created_at", m.end),
        supabase.from("opportunities").select("*", { count: "exact", head: true }).in("stage", ["closed_won"]).gte("updated_at", m.start).lt("updated_at", m.end),
    ]);

    const results = await Promise.all(queries);

    return months.map((m, i) => ({
        month: m.label,
        total: results[i * 2].count || 0,
        won: results[i * 2 + 1].count || 0,
    }));
}
