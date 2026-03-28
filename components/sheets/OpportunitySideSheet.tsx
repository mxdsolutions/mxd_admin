"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DetailFields, LinkedEntityCard } from "./DetailFields";
import { NotesPanel } from "./NotesPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { createClient } from "@/lib/supabase/client";

type Opportunity = {
    id: string;
    title: string;
    stage: string;
    value: number;
    probability: number | null;
    expected_close_date: string | null;
    description?: string | null;
    contact?: { id: string; first_name: string; last_name: string } | null;
    company?: { id: string; name: string } | null;
    lead?: { id: string; title: string } | null;
    assignee?: { id: string; full_name: string } | null;
    created_at: string;
};

interface OpportunitySideSheetProps {
    opportunity: Opportunity | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

const stageConfig: Record<string, { label: string; color: string }> = {
    appt_booked: { label: "Appt Booked", color: "bg-blue-500" },
    proposal_sent: { label: "Proposal Sent", color: "bg-amber-500" },
    negotiation: { label: "Negotiation", color: "bg-indigo-500" },
    closed_won: { label: "Closed Won", color: "bg-emerald-500" },
    closed_lost: { label: "Closed Lost", color: "bg-rose-400" },
};

export function OpportunitySideSheet({ opportunity, open, onOpenChange, onUpdate }: OpportunitySideSheetProps) {
    const [activeTab, setActiveTab] = useState("details");
    const [data, setData] = useState<Opportunity | null>(opportunity);
    const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        setData(opportunity);
    }, [opportunity]);

    useEffect(() => {
        if (data?.id) setActiveTab("details");
    }, [data?.id]);

    useEffect(() => {
        const supabase = createClient();
        supabase.from("profiles").select("id, full_name, email").then(({ data: profiles }) => {
            if (profiles) setUsers(profiles.map((p) => ({ value: p.id, label: p.full_name || p.email || p.id })));
        });
    }, []);

    const handleSave = useCallback(async (column: string, value: string | number | null) => {
        if (!data) return;
        const supabase = createClient();
        const { error } = await supabase
            .from("opportunities")
            .update({ [column]: value, updated_at: new Date().toISOString() })
            .eq("id", data.id);
        if (!error) {
            setData((prev) => prev ? { ...prev, [column]: value } : prev);
            onUpdate?.();
        }
    }, [data, onUpdate]);

    if (!data) return null;

    const stage = stageConfig[data.stage] || stageConfig.appt_booked;
    const tabs = [
        { id: "details", label: "Details" },
        { id: "notes", label: "Notes" },
        { id: "activity", label: "Activity" },
    ];

    const probabilityColor = (p: number) => {
        if (p >= 70) return "bg-emerald-500";
        if (p >= 40) return "bg-amber-400";
        return "bg-rose-400";
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl flex flex-col p-0 border-l border-border bg-background">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-border">
                    <SheetHeader className="flex flex-row items-start gap-4 space-y-0 text-left">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-lg font-bold text-emerald-600">$</span>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2.5">
                                <SheetTitle className="text-lg font-bold truncate">{data.title}</SheetTitle>
                                <Badge variant="outline" className="shrink-0 text-[10px] font-bold uppercase tracking-wider">
                                    <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", stage.color)} />
                                    {stage.label}
                                </Badge>
                            </div>
                            <SheetDescription className="text-sm text-muted-foreground mt-1">
                                ${data.value.toLocaleString()}
                                {data.probability != null && ` · ${data.probability}% probability`}
                            </SheetDescription>
                        </div>
                    </SheetHeader>
                </div>

                {/* Tabs + Content */}
                <div className="flex flex-col flex-1 min-h-0 bg-secondary/20">
                    <div className="px-6 border-b border-border/50 bg-background">
                        <div className="flex gap-6 -mb-px pt-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "pb-3 text-sm font-medium transition-colors relative focus:outline-none",
                                        activeTab === tab.id
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-foreground rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === "details" && (
                            <div className="space-y-4">
                                {/* Value hero card */}
                                <div className="rounded-xl border border-border bg-card p-5">
                                    <div className="flex items-baseline justify-between mb-3">
                                        <span className="text-2xl font-bold tabular-nums text-foreground">
                                            ${data.value.toLocaleString()}
                                        </span>
                                        {data.probability != null && (
                                            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                                                {data.probability}%
                                            </span>
                                        )}
                                    </div>
                                    {data.probability != null && (
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all", probabilityColor(data.probability))}
                                                style={{ width: `${data.probability}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl border border-border bg-card p-5">
                                    <DetailFields
                                        onSave={handleSave}
                                        fields={[
                                            {
                                                label: "Title",
                                                value: data.title,
                                                dbColumn: "title",
                                                type: "text",
                                                rawValue: data.title,
                                            },
                                            {
                                                label: "Stage",
                                                value: stage.label,
                                                dbColumn: "stage",
                                                type: "select",
                                                rawValue: data.stage,
                                                options: Object.entries(stageConfig).map(([k, v]) => ({ value: k, label: v.label })),
                                            },
                                            {
                                                label: "Value",
                                                value: `$${data.value.toLocaleString()}`,
                                                dbColumn: "value",
                                                type: "number",
                                                rawValue: data.value,
                                            },
                                            {
                                                label: "Probability",
                                                value: data.probability != null ? `${data.probability}%` : null,
                                                dbColumn: "probability",
                                                type: "number",
                                                rawValue: data.probability,
                                            },
                                            {
                                                label: "Expected Close",
                                                value: data.expected_close_date ? new Date(data.expected_close_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
                                                dbColumn: "expected_close_date",
                                                type: "date",
                                                rawValue: data.expected_close_date,
                                            },
                                            {
                                                label: "Assigned To",
                                                value: data.assignee?.full_name,
                                                dbColumn: "assigned_to",
                                                type: "select",
                                                rawValue: data.assignee?.id ?? null,
                                                options: users,
                                            },
                                            {
                                                label: "Created",
                                                value: new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                                            },
                                        ]}
                                    />
                                </div>

                                {/* Description */}
                                <div className="rounded-xl border border-border bg-card p-5">
                                    <DetailFields
                                        onSave={handleSave}
                                        fields={[
                                            {
                                                label: "Description",
                                                value: data.description || null,
                                                dbColumn: "description",
                                                type: "text",
                                                rawValue: data.description,
                                            },
                                        ]}
                                    />
                                </div>

                                {data.lead && (
                                    <LinkedEntityCard
                                        label="Related Lead"
                                        title={data.lead.title}
                                        icon={
                                            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        }
                                    />
                                )}

                                {data.contact && (
                                    <LinkedEntityCard
                                        label="Contact"
                                        title={`${data.contact.first_name} ${data.contact.last_name}`}
                                        icon={
                                            <span className="text-[9px] font-bold text-muted-foreground">
                                                {data.contact.first_name[0]}{data.contact.last_name[0]}
                                            </span>
                                        }
                                    />
                                )}

                                {data.company && (
                                    <LinkedEntityCard
                                        label="Company"
                                        title={data.company.name}
                                        icon={
                                            <span className="text-[10px] font-bold text-muted-foreground">
                                                {data.company.name[0]}
                                            </span>
                                        }
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === "notes" && (
                            <NotesPanel entityType="opportunity" entityId={data.id} />
                        )}

                        {activeTab === "activity" && (
                            <ActivityTimeline entityType="opportunity" entityId={data.id} />
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
