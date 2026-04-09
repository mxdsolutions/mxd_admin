/**
 * MXD Web Template Design System
 * ─────────────────────────
 * Central file for shared styles, typography, spacing, and component patterns.
 */

/* ── Typography ── */

// --- Headings ---

/** Page title — used in DashboardControls / sticky header context */
export const pageHeadingClass = "text-lg font-semibold tracking-tight";

/** Section heading inside a page (card titles, tab subtitles) */
export const sectionHeadingClass = "text-base font-semibold text-foreground";

/** Side sheet title */
export const sheetTitleClass = "text-[22px] font-bold truncate leading-tight";

/** Modal / dialog title */
export const dialogTitleClass = "text-xl font-semibold leading-none tracking-tight";

/** Hero heading — onboarding / auth splash pages */
export const heroHeadingClass = "text-5xl md:text-6xl font-bold tracking-tight";

/** Hero sub-heading */
export const heroSubheadingClass = "text-4xl md:text-5xl font-bold tracking-tight";

// --- Body ---

/** Standard body text */
export const bodyClass = "text-sm text-foreground";

/** Body text — slightly larger for prominent content (dialog descriptions, detail values) */
export const bodyLargeClass = "text-[15px] text-foreground";

/** Muted secondary text (subtitles, helper text) */
export const bodyMutedClass = "text-sm text-muted-foreground";

// --- Labels ---

/** Form field label */
export const fieldLabelClass = "text-sm font-medium text-muted-foreground";

/** Uppercase section / category label */
export const sectionLabelClass = "text-[11px] font-bold text-muted-foreground uppercase tracking-wider";

/** Uppercase section label — softer variant */
export const sectionLabelSoftClass = "text-xs uppercase tracking-wider font-semibold text-muted-foreground/60";

// --- Stats ---

/** Stat label — metric cards */
export const statLabelClass = "text-[11px] text-muted-foreground uppercase tracking-wide";

/** Stat value — large bold value */
export const statValueClass = "text-xl font-bold tracking-tight";

// --- Interactive ---

/** Navigation item (sidebar) */
export const navItemClass = "text-sm font-medium";

/** Tab button */
export const tabClass = "text-[17px] font-medium";

/** Badge / status pill */
export const badgeClass = "text-[11px] font-semibold uppercase tracking-wider";

/** Small meta text (timestamps, ids) */
export const metaClass = "text-[10px] text-muted-foreground";

/* ── Spacing ── */

/** Standard gap between cards and sections */
export const cardGap = "gap-3";

/* ── Table Styles ── */

export const tableBase = "w-full text-sm text-left";

export const tableHead = "bg-secondary";

export const tableHeadCell = "py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider";

export const tableRow = "border-b border-border/40 transition-colors hover:bg-muted/30";

export const tableCell = "py-4 md:py-5 align-middle";

export const tableCellMuted = "p-3 text-muted-foreground";

/* ── Filter Pills ── */

export const filterPillBase = "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors";
export const filterPillActive = "bg-foreground text-background border-foreground";
export const filterPillInactive = "bg-secondary text-muted-foreground border-border/50 hover:bg-secondary/80 hover:text-foreground";
