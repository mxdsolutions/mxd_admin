export type StatusItem = {
    id: string;
    label: string;
    color: string;
    is_default: boolean;
    behaviors: string[];
};

export type EntityType = "lead" | "opportunity" | "job";

// -- Default status arrays (exact match of the previously hardcoded values) --

export const DEFAULT_LEAD_STATUSES: StatusItem[] = [
    { id: "new", label: "New", color: "bg-blue-500", is_default: true, behaviors: [] },
    { id: "contacted", label: "Contacted", color: "bg-amber-500", is_default: false, behaviors: [] },
    { id: "qualified", label: "Qualified", color: "bg-emerald-500", is_default: false, behaviors: [] },
    { id: "unqualified", label: "Unqualified", color: "bg-rose-400", is_default: false, behaviors: [] },
    { id: "converted", label: "Converted", color: "bg-violet-500", is_default: false, behaviors: [] },
];

export const DEFAULT_OPPORTUNITY_STAGES: StatusItem[] = [
    { id: "appt_booked", label: "Appt Booked", color: "bg-blue-500", is_default: true, behaviors: [] },
    { id: "proposal_sent", label: "Proposal Sent", color: "bg-amber-500", is_default: false, behaviors: [] },
    { id: "negotiation", label: "Negotiation", color: "bg-indigo-500", is_default: false, behaviors: [] },
    { id: "closed_won", label: "Closed Won", color: "bg-emerald-500", is_default: false, behaviors: ["trigger_job_creation"] },
    { id: "closed_lost", label: "Closed Lost", color: "bg-rose-400", is_default: false, behaviors: [] },
];

export const DEFAULT_JOB_STATUSES: StatusItem[] = [
    { id: "new", label: "New", color: "bg-amber-500", is_default: true, behaviors: [] },
    { id: "in_progress", label: "In Progress", color: "bg-blue-500", is_default: false, behaviors: [] },
    { id: "completed", label: "Completed", color: "bg-emerald-500", is_default: false, behaviors: [] },
    { id: "cancelled", label: "Cancelled", color: "bg-rose-400", is_default: false, behaviors: [] },
];

export const DEFAULTS_BY_ENTITY: Record<EntityType, StatusItem[]> = {
    lead: DEFAULT_LEAD_STATUSES,
    opportunity: DEFAULT_OPPORTUNITY_STAGES,
    job: DEFAULT_JOB_STATUSES,
};

/** Get the status id marked as default, falling back to the first item */
export function getDefaultStatusId(statuses: StatusItem[]): string {
    return statuses.find((s) => s.is_default)?.id ?? statuses[0]?.id ?? "new";
}

/** Check if a status has a specific behavior */
export function hasBehavior(statuses: StatusItem[], statusId: string, behavior: string): boolean {
    return statuses.find((s) => s.id === statusId)?.behaviors.includes(behavior) ?? false;
}

/** Convert statuses to Kanban column format */
export function toKanbanColumns(statuses: StatusItem[]): { id: string; label: string; color: string }[] {
    return statuses.map((s) => ({ id: s.id, label: s.label, color: s.color }));
}

/** Convert statuses to a Record keyed by id (for side sheet statusConfig) */
export function toStatusConfig(statuses: StatusItem[]): Record<string, { label: string; color: string }> {
    return Object.fromEntries(statuses.map((s) => [s.id, { label: s.label, color: s.color }]));
}
