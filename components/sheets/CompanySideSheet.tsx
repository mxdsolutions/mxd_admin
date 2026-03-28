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
import { DetailFields } from "./DetailFields";
import { NotesPanel } from "./NotesPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { createClient } from "@/lib/supabase/client";

type Company = {
    id: string;
    name: string;
    industry: string | null;
    phone: string | null;
    email: string | null;
    website?: string | null;
    city: string | null;
    state: string | null;
    address?: string | null;
    postcode?: string | null;
    status: string;
    notes?: string | null;
    created_at: string;
};

interface CompanySideSheetProps {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

export function CompanySideSheet({ company, open, onOpenChange, onUpdate }: CompanySideSheetProps) {
    const [activeTab, setActiveTab] = useState("details");
    const [data, setData] = useState<Company | null>(company);

    useEffect(() => {
        setData(company);
    }, [company]);

    useEffect(() => {
        if (data?.id) setActiveTab("details");
    }, [data?.id]);

    const handleSave = useCallback(async (column: string, value: string | number | null) => {
        if (!data) return;
        const supabase = createClient();
        const { error } = await supabase
            .from("companies")
            .update({ [column]: value, updated_at: new Date().toISOString() })
            .eq("id", data.id);
        if (!error) {
            setData((prev) => prev ? { ...prev, [column]: value } : prev);
            onUpdate?.();
        }
    }, [data, onUpdate]);

    if (!data) return null;

    const tabs = [
        { id: "details", label: "Details" },
        { id: "notes", label: "Notes" },
        { id: "activity", label: "Activity" },
    ];

    const location = [data.city, data.state].filter(Boolean).join(", ");

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl flex flex-col p-0 border-l border-border bg-background">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-border">
                    <SheetHeader className="flex flex-row items-start gap-4 space-y-0 text-left">
                        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center font-bold text-xl text-foreground ring-1 ring-border/50 shrink-0 mt-0.5">
                            {data.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2.5">
                                <SheetTitle className="text-xl font-bold truncate">{data.name}</SheetTitle>
                                <Badge variant="outline" className="shrink-0 text-[10px] font-bold uppercase tracking-wider">
                                    <span className={cn(
                                        "w-1.5 h-1.5 rounded-full mr-1.5",
                                        data.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                                    )} />
                                    {data.status}
                                </Badge>
                            </div>
                            <SheetDescription className="text-sm text-muted-foreground mt-1 truncate">
                                {data.industry || location || "Company"}
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
                                <div className="rounded-xl border border-border bg-card p-5">
                                    <DetailFields
                                        onSave={handleSave}
                                        fields={[
                                            { label: "Name", value: data.name, dbColumn: "name", type: "text", rawValue: data.name },
                                            { label: "Industry", value: data.industry, dbColumn: "industry", type: "text", rawValue: data.industry },
                                            { label: "Email", value: data.email, dbColumn: "email", type: "text", rawValue: data.email },
                                            { label: "Phone", value: data.phone, dbColumn: "phone", type: "text", rawValue: data.phone },
                                            { label: "Website", value: data.website, dbColumn: "website", type: "text", rawValue: data.website },
                                            { label: "Address", value: data.address, dbColumn: "address", type: "text", rawValue: data.address },
                                            { label: "City", value: data.city, dbColumn: "city", type: "text", rawValue: data.city },
                                            { label: "State", value: data.state, dbColumn: "state", type: "text", rawValue: data.state },
                                            { label: "Postcode", value: data.postcode, dbColumn: "postcode", type: "text", rawValue: data.postcode },
                                            {
                                                label: "Status",
                                                value: data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : null,
                                                dbColumn: "status",
                                                type: "select",
                                                rawValue: data.status,
                                                options: [
                                                    { value: "active", label: "Active" },
                                                    { value: "inactive", label: "Inactive" },
                                                ],
                                            },
                                            {
                                                label: "Created",
                                                value: new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                                            },
                                        ]}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "notes" && (
                            <NotesPanel entityType="company" entityId={data.id} />
                        )}

                        {activeTab === "activity" && (
                            <ActivityTimeline entityType="company" entityId={data.id} />
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
