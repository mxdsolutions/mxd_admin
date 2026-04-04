"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardPage, DashboardControls } from "@/components/dashboard/DashboardPage";
import { usePageTitle } from "@/lib/page-title-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Kanban } from "@/components/Kanban";
import { cn, getContactInitials } from "@/lib/utils";
import {
    MagnifyingGlassIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { CreateOpportunityModal } from "@/components/modals/CreateOpportunityModal";
import { ClosedWonJobModal } from "@/components/modals/ClosedWonJobModal";
import { CreateJobFromOpportunityModal } from "@/components/modals/CreateJobFromOpportunityModal";
import { OpportunitySideSheet } from "@/components/sheets/OpportunitySideSheet";
import { useOpportunities, useStatusConfig } from "@/lib/swr";
import { useKanbanPage } from "@/lib/hooks/use-kanban-page";
import { DEFAULT_OPPORTUNITY_STAGES, toKanbanColumns, hasBehavior } from "@/lib/status-config";

type Opportunity = {
    id: string;
    title: string;
    stage: string;
    value: number;
    probability: number | null;
    expected_close_date: string | null;
    contact?: {
        id: string;
        first_name: string;
        last_name: string;
    } | null;
    company?: {
        id: string;
        name: string;
    } | null;
    company_id?: string | null;
    created_at: string;
};

// Stage columns are loaded dynamically from tenant config

const probabilityColor = (p: number) => {
    if (p >= 70) return "bg-emerald-500";
    if (p >= 40) return "bg-amber-400";
    return "bg-rose-400";
};

function formatCloseDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / 86400000);

    const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (days < 0) return { text: formatted, urgent: true, label: "Overdue" };
    if (days <= 7) return { text: formatted, urgent: true, label: `${days}d left` };
    if (days <= 30) return { text: formatted, urgent: false, label: `${days}d left` };
    return { text: formatted, urgent: false, label: null };
}

export default function OpportunitiesPage() {
    return (
        <Suspense>
            <OpportunitiesPageContent />
        </Suspense>
    );
}

function OpportunitiesPageContent() {
    usePageTitle("Opportunities");
    const searchParams = useSearchParams();
    const { data: stageData } = useStatusConfig("opportunity");
    const stages = stageData?.statuses ?? DEFAULT_OPPORTUNITY_STAGES;
    const stageColumns = toKanbanColumns(stages);
    const oppsHook = useOpportunities();
    const { search, setSearch, items, filteredItems: filteredOpportunities, isLoading: loading, handleMove, refresh: fetchOpportunities } = useKanbanPage<Opportunity>({
        swr: oppsHook,
        endpoint: "/api/opportunities",
        statusField: "stage",
        searchFilter: (opp, q) =>
            opp.title.toLowerCase().includes(q) ||
            opp.company?.name.toLowerCase().includes(q) ||
            opp.contact?.first_name.toLowerCase().includes(q) ||
            opp.contact?.last_name.toLowerCase().includes(q) || false,
    });
    const [showCreate, setShowCreate] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
    const [closedWonOpp, setClosedWonOpp] = useState<Opportunity | null>(null);
    const [showCreateJob, setShowCreateJob] = useState(false);
    const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);
    const router = useRouter();

    // Handle deep-link open from URL params
    useEffect(() => {
        if (!oppsHook.data?.items) return;
        const openId = pendingOpenId || searchParams.get("open");
        if (openId) {
            const opp = items.find((o: Opportunity) => o.id === openId);
            if (opp) {
                setSelectedOpp(opp);
            }
            setPendingOpenId(null);
        }
    }, [oppsHook.data, searchParams, pendingOpenId, items]);

    return (
        <DashboardPage>
            <DashboardControls>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search opportunities..."
                            className="pl-9 rounded-xl border-border/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <Button className="rounded-full px-6 shrink-0" onClick={() => setShowCreate(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Opportunity
                </Button>
            </DashboardControls>

            <Kanban
                items={filteredOpportunities}
                columns={stageColumns}
                getItemStatus={(opp) => opp.stage}
                loading={loading}
                onCardClick={(opp) => setSelectedOpp(opp)}
                onItemMove={async (itemId, from, to, label) => {
                    await handleMove(itemId, from, to, label);
                    if (hasBehavior(stages, to, "trigger_job_creation")) {
                        const opp = items.find(o => o.id === itemId);
                        if (opp) setClosedWonOpp({ ...opp, stage: to });
                    }
                }}
                renderCard={(opp) => {
                    const closeInfo = opp.expected_close_date
                        ? formatCloseDate(opp.expected_close_date)
                        : null;

                    return (
                        <div className="space-y-2.5">
                            {/* Title */}
                            <p className="font-semibold text-[13px] leading-snug line-clamp-2 text-foreground">
                                {opp.title}
                            </p>

                            {/* Value · Company */}
                            <div className="flex items-center gap-0 text-[12px]">
                                <span className="font-bold tabular-nums text-foreground">
                                    ${opp.value.toLocaleString()}
                                </span>
                                {opp.company && (
                                    <>
                                        <span className="text-muted-foreground mx-1.5">·</span>
                                        <span className="text-muted-foreground truncate">
                                            {opp.company.name}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Probability */}
                            {opp.probability != null && (
                                <div className="flex items-center gap-2">
                                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                probabilityColor(opp.probability)
                                            )}
                                            style={{ width: `${opp.probability}%` }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                                        {opp.probability}%
                                    </span>
                                </div>
                            )}

                            {/* Contact avatar + close date footer */}
                            <div className="flex items-center justify-between pt-1">
                                {opp.contact ? (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 ring-2 ring-background">
                                            <span className="text-[9px] font-bold text-muted-foreground">
                                                {getContactInitials(opp.contact.first_name, opp.contact.last_name)}
                                            </span>
                                        </div>
                                    </div>
                                ) : <div />}
                                {closeInfo && (
                                    <span className={cn(
                                        "text-[11px] font-medium",
                                        closeInfo.urgent ? "text-rose-500" : "text-muted-foreground"
                                    )}>
                                        {closeInfo.text}
                                        {closeInfo.label && ` · ${closeInfo.label}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }}
            />

            <CreateOpportunityModal
                open={showCreate}
                onOpenChange={setShowCreate}
                onCreated={() => fetchOpportunities()}
            />

            <OpportunitySideSheet
                opportunity={selectedOpp}
                open={!!selectedOpp}
                onOpenChange={(open) => { if (!open) setSelectedOpp(null); }}
                onUpdate={fetchOpportunities}
                onStageChange={(opp, newStage) => {
                    if (hasBehavior(stages, newStage, "trigger_job_creation")) {
                        setClosedWonOpp(opp);
                    }
                }}
            />

            <ClosedWonJobModal
                open={!!closedWonOpp && !showCreateJob}
                onOpenChange={(open) => { if (!open) setClosedWonOpp(null); }}
                opportunityTitle={closedWonOpp?.title || ""}
                onConfirm={() => setShowCreateJob(true)}
                onSkip={() => setClosedWonOpp(null)}
            />

            {closedWonOpp && (
                <CreateJobFromOpportunityModal
                    open={showCreateJob}
                    onOpenChange={(open) => { if (!open) { setShowCreateJob(false); setClosedWonOpp(null); } }}
                    opportunityId={closedWonOpp.id}
                    opportunityTitle={closedWonOpp.title}
                    companyId={closedWonOpp.company?.id || closedWonOpp.company_id || null}
                    companyName={closedWonOpp.company?.name || null}
                    onCreated={(job) => {
                        setShowCreateJob(false);
                        setClosedWonOpp(null);
                        router.push(`/dashboard/operations/jobs?open=${job.id}`);
                    }}
                />
            )}
        </DashboardPage>
    );
}
