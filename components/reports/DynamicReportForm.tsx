"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TemplateSchema } from "@/lib/report-templates/types";
import { ReportFormViewer } from "./ReportFormViewer";

interface DynamicReportFormProps {
    schema: TemplateSchema;
    initialData: Record<string, unknown>;
    reportId: string;
    tenantId?: string;
    readOnly?: boolean;
    onSave: (data: Record<string, unknown>) => Promise<void>;
}

export function DynamicReportForm({ schema, initialData, reportId, tenantId, readOnly, onSave }: DynamicReportFormProps) {
    const [data, setData] = useState<Record<string, unknown>>(initialData || {});
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSectionChange = useCallback((sectionId: string, sectionData: Record<string, unknown> | Record<string, unknown>[]) => {
        setData((prev) => ({ ...prev, [sectionId]: sectionData }));
    }, []);

    useEffect(() => {
        if (readOnly) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(async () => {
            setSaveStatus("saving");
            try {
                await onSave(data);
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
            } catch {
                setSaveStatus("idle");
            }
        }, 1500);

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    return (
        <div className="space-y-6">
            {!readOnly && (
                <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                        {saveStatus === "saving" && "Saving..."}
                        {saveStatus === "saved" && "Saved"}
                    </span>
                </div>
            )}
            <ReportFormViewer
                schema={schema}
                data={data}
                onChange={handleSectionChange}
                readOnly={readOnly}
                reportId={reportId}
                tenantId={tenantId}
                mode="scroll"
            />
        </div>
    );
}
