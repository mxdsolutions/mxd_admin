"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DetailFields, LinkedEntityCard } from "./DetailFields";
import { NotesPanel } from "./NotesPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { SideSheetLayout } from "@/features/side-sheets/SideSheetLayout";
import { LineItemsTable } from "@/features/line-items/LineItemsTable";
import { createClient } from "@/lib/supabase/client";
import { useProfiles, useStatusConfig } from "@/lib/swr";
import { DEFAULT_OPPORTUNITY_STAGES, toStatusConfig, hasBehavior } from "@/lib/status-config";

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

type LineItem = {
    id: string;
    opportunity_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    product: { id: string; name: string } | null;
    created_at: string;
};

type Service = {
    id: string;
    name: string;
    initial_value: number | null;
};

interface OpportunitySideSheetProps {
    opportunity: Opportunity | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
    onStageChange?: (opportunity: Opportunity, newStage: string) => void;
}

// Stage config is loaded dynamically from tenant config

/** Side sheet for viewing/editing opportunity details, line items, and stage management. */
export function OpportunitySideSheet({ opportunity, open, onOpenChange, onUpdate, onStageChange }: OpportunitySideSheetProps) {
    const [activeTab, setActiveTab] = useState("details");
    const [data, setData] = useState<Opportunity | null>(opportunity);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const { data: stageData } = useStatusConfig("opportunity");
    const stageConfig = toStatusConfig(stageData?.statuses ?? DEFAULT_OPPORTUNITY_STAGES);
    const stages = stageData?.statuses ?? DEFAULT_OPPORTUNITY_STAGES;
    const { data: profilesData } = useProfiles();
    const users: { value: string; label: string }[] = useMemo(() =>
        (profilesData?.users || []).map((u: { id: string; email?: string; user_metadata?: { full_name?: string } }) => ({
            value: u.id,
            label: u.user_metadata?.full_name || u.email || u.id,
        })),
        [profilesData]
    );

    useEffect(() => { setData(opportunity); }, [opportunity]);
    useEffect(() => { if (data?.id) setActiveTab("details"); }, [data?.id]);

    useEffect(() => {
        const supabase = createClient();
        supabase.from("products").select("id, name, initial_value").eq("status", "active").then(({ data: prods }) => {
            if (prods) setServices(prods);
        });
    }, []);

    const fetchLineItems = useCallback(async (opportunityId: string) => {
        const res = await fetch(`/api/opportunity-line-items?opportunity_id=${opportunityId}`);
        if (res.ok) {
            const { lineItems: items } = await res.json();
            setLineItems(items || []);
        }
    }, []);

    useEffect(() => {
        if (data?.id) fetchLineItems(data.id);
    }, [data?.id, fetchLineItems]);

    const handleAddLineItem = async (productId: string, quantity: number, unitPrice: number) => {
        if (!data) return;
        const res = await fetch("/api/opportunity-line-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opportunity_id: data.id, product_id: productId, quantity, unit_price: unitPrice }),
        });
        if (res.ok) {
            const { lineItem, opportunityValue } = await res.json();
            setLineItems((prev) => [...prev, lineItem]);
            setData((prev) => prev ? { ...prev, value: opportunityValue } : prev);
            onUpdate?.();
        } else {
            toast.error("Failed to add service");
        }
    };

    const handleUpdateLineItem = async (id: string, field: "quantity" | "unit_price", value: number) => {
        const res = await fetch("/api/opportunity-line-items", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, [field]: value }),
        });
        if (res.ok) {
            const { lineItem, opportunityValue } = await res.json();
            setLineItems((prev) => prev.map((li) => li.id === id ? lineItem : li));
            setData((prev) => prev ? { ...prev, value: opportunityValue } : prev);
            onUpdate?.();
        } else {
            toast.error("Failed to update");
        }
    };

    const handleDeleteLineItem = async (id: string) => {
        const res = await fetch(`/api/opportunity-line-items?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            const { opportunityValue } = await res.json();
            setLineItems((prev) => prev.filter((li) => li.id !== id));
            setData((prev) => prev ? { ...prev, value: opportunityValue } : prev);
            onUpdate?.();
        } else {
            toast.error("Failed to remove service");
        }
    };

    const handleSave = useCallback(async (column: string, value: string | number | null) => {
        if (!data) return;
        const supabase = createClient();
        const { error } = await supabase
            .from("opportunities")
            .update({ [column]: value, updated_at: new Date().toISOString() })
            .eq("id", data.id);
        if (!error) {
            const updated = { ...data, [column]: value };
            setData(updated);
            onUpdate?.();
            if (column === "stage" && hasBehavior(stages, value as string, "trigger_job_creation")) {
                onStageChange?.(updated, value as string);
            }
        }
    }, [data, onUpdate, onStageChange]);

    if (!data) return null;

    const stage = stageConfig[data.stage] || stageConfig.appt_booked;

    const probabilityColor = (p: number) => {
        if (p >= 70) return "bg-emerald-500";
        if (p >= 40) return "bg-amber-400";
        return "bg-rose-400";
    };

    const tabs = [
        { id: "details", label: "Details" },
        { id: "services", label: `Services (${lineItems.length})` },
        { id: "notes", label: "Notes" },
        { id: "activity", label: "Activity" },
    ];

    return (
        <SideSheetLayout
            open={open}
            onOpenChange={onOpenChange}
            icon={<span className="text-lg font-bold text-emerald-600">$</span>}
            iconBg="bg-emerald-500/10"
            title={data.title}
            subtitle={`$${data.value.toLocaleString()}${data.probability != null ? ` · ${data.probability}% probability` : ""}`}
            badge={{ label: stage.label, dotColor: stage.color }}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
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
                                { label: "Title", value: data.title, dbColumn: "title", type: "text", rawValue: data.title },
                                { label: "Stage", value: stage.label, dbColumn: "stage", type: "select", rawValue: data.stage, options: Object.entries(stageConfig).map(([k, v]) => ({ value: k, label: v.label })) },
                                { label: "Value", value: `$${data.value.toLocaleString()}`, dbColumn: "value", type: "number", rawValue: data.value },
                                { label: "Probability", value: data.probability != null ? `${data.probability}%` : null, dbColumn: "probability", type: "number", rawValue: data.probability },
                                { label: "Expected Close", value: data.expected_close_date ? new Date(data.expected_close_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null, dbColumn: "expected_close_date", type: "date", rawValue: data.expected_close_date },
                                { label: "Assigned To", value: data.assignee?.full_name, dbColumn: "assigned_to", type: "select", rawValue: data.assignee?.id ?? null, options: users },
                                { label: "Created", value: new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                            ]}
                        />
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5">
                        <DetailFields
                            onSave={handleSave}
                            fields={[
                                { label: "Description", value: data.description || null, dbColumn: "description", type: "text", rawValue: data.description },
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
                            icon={<span className="text-[9px] font-bold text-muted-foreground">{data.contact.first_name[0]}{data.contact.last_name[0]}</span>}
                        />
                    )}

                    {data.company && (
                        <LinkedEntityCard
                            label="Company"
                            title={data.company.name}
                            icon={<span className="text-[10px] font-bold text-muted-foreground">{data.company.name[0]}</span>}
                        />
                    )}
                </div>
            )}

            {activeTab === "services" && (
                <LineItemsTable
                    mode="live"
                    items={lineItems}
                    services={services}
                    onAdd={handleAddLineItem}
                    onUpdate={handleUpdateLineItem}
                    onDelete={handleDeleteLineItem}
                />
            )}

            {activeTab === "notes" && (
                <NotesPanel entityType="opportunity" entityId={data.id} />
            )}

            {activeTab === "activity" && (
                <ActivityTimeline entityType="opportunity" entityId={data.id} />
            )}
        </SideSheetLayout>
    );
}
