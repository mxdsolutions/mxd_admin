"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FormSection } from "./FormSection";
import type { TemplateSchema } from "@/lib/report-templates/types";

type ViewerMode = "single" | "wizard" | "scroll";

interface ReportFormViewerProps {
    schema: TemplateSchema;
    data: Record<string, unknown>;
    onChange?: (sectionId: string, sectionData: Record<string, unknown> | Record<string, unknown>[]) => void;
    readOnly?: boolean;
    reportId?: string;
    tenantId?: string;
    mode: ViewerMode;
    currentIndex?: number;
    direction?: number;
    borderless?: boolean;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
        x: direction > 0 ? -80 : 80,
        opacity: 0,
    }),
};

const fadeVariants = {
    enter: { opacity: 0, y: 8 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

function noop() {}

export function ReportFormViewer({
    schema,
    data,
    onChange,
    readOnly,
    reportId,
    tenantId,
    mode,
    currentIndex = 0,
    direction = 1,
    borderless,
}: ReportFormViewerProps) {
    const handleSectionChange = (sectionId: string) => {
        return (sectionData: Record<string, unknown> | Record<string, unknown>[]) => {
            onChange?.(sectionId, sectionData);
        };
    };

    const getSectionData = (sectionId: string, sectionType: string) => {
        return (data[sectionId] as Record<string, unknown> | Record<string, unknown>[]) ||
            (sectionType === "repeater" ? [] : {});
    };

    // Scroll mode — render all sections in a stack
    if (mode === "scroll") {
        return (
            <div className="space-y-6">
                {schema.sections.map((section) => (
                    <FormSection
                        key={section.id}
                        section={section}
                        data={getSectionData(section.id, section.type)}
                        onChange={onChange ? handleSectionChange(section.id) : noop}
                        readOnly={readOnly}
                        reportId={reportId}
                        tenantId={tenantId}
                        borderless={borderless}
                    />
                ))}
            </div>
        );
    }

    // Single / wizard mode — render one section with animation
    const section = schema.sections[currentIndex];
    if (!section) return null;

    const isWizard = mode === "wizard";
    const variants = isWizard ? slideVariants : fadeVariants;
    const key = isWizard ? currentIndex : `${currentIndex}-${section.id}`;

    return (
        <AnimatePresence mode="wait" custom={direction}>
            <motion.div
                key={key}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: isWizard ? 0.2 : 0.15, ease: "easeInOut" }}
            >
                <FormSection
                    section={section}
                    data={getSectionData(section.id, section.type)}
                    onChange={onChange ? handleSectionChange(section.id) : noop}
                    readOnly={readOnly}
                    reportId={reportId}
                    tenantId={tenantId}
                    borderless={borderless}
                />
            </motion.div>
        </AnimatePresence>
    );
}
