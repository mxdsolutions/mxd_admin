import type { SectionDef, TemplateSchema } from "@/lib/report-templates/types";

export type SectionStatus = "complete" | "incomplete" | "empty";

function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined || value === "") return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
}

export function computeSectionValidation(
    section: SectionDef,
    data: Record<string, unknown> | Record<string, unknown>[] | undefined
): SectionStatus {
    const requiredFields = section.fields.filter(
        (f) => f.required && f.type !== "heading"
    );

    if (requiredFields.length === 0) return "complete";

    if (section.type === "repeater") {
        const items = Array.isArray(data) ? data : [];
        if (items.length === 0) {
            return section.minItems && section.minItems > 0 ? "incomplete" : "complete";
        }
        const allFilled = items.every((item) =>
            requiredFields.every((f) => !isEmpty(item[f.id]))
        );
        return allFilled ? "complete" : "incomplete";
    }

    const sectionData = (data && !Array.isArray(data) ? data : {}) as Record<string, unknown>;
    const filledCount = requiredFields.filter((f) => !isEmpty(sectionData[f.id])).length;

    if (filledCount === 0) return "empty";
    if (filledCount === requiredFields.length) return "complete";
    return "incomplete";
}

export function computeAllSectionValidations(
    schema: TemplateSchema,
    data: Record<string, unknown>
): SectionStatus[] {
    return schema.sections.map((section) =>
        computeSectionValidation(section, data[section.id] as Record<string, unknown> | Record<string, unknown>[] | undefined)
    );
}
