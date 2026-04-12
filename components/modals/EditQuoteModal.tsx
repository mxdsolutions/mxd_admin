"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    IconTrash as TrashIcon,
    IconSearch as MagnifyingGlassIcon,
    IconLayoutList as SectionIcon,
    IconChevronUp,
    IconChevronDown,
} from "@tabler/icons-react";
import { InlineNumberInput } from "@/features/line-items/InlineNumberInput";
import { formatCurrency } from "@/lib/utils";
import { useServiceOptions, type PricingItem } from "@/lib/swr";

interface EditQuoteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteId: string;
    onUpdated?: () => void;
}

type QuoteData = {
    id: string;
    title: string;
    scope_description: string | null;
    material_margin: number;
    labour_margin: number;
    gst_inclusive: boolean;
    valid_until: string | null;
};

type DbSection = {
    id: string;
    name: string;
    sort_order: number;
};

type LineItem = {
    id: string;
    pricing_matrix_id: string | null;
    section_id: string | null;
    description: string;
    line_description: string | null;
    trade: string | null;
    uom: string | null;
    quantity: number;
    material_cost: number;
    labour_cost: number;
    sort_order: number;
};

type ServiceItem = {
    id: string;
    name: string;
    initial_value: number | null;
};

function parseNum(val: string | null | undefined): number {
    if (!val) return 0;
    const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
}

const GST_RATE = 0.1;

export function EditQuoteModal({ open, onOpenChange, quoteId, onUpdated }: EditQuoteModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [sections, setSections] = useState<DbSection[]>([]);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [scopeDescription, setScopeDescription] = useState("");
    const [materialMargin, setMaterialMargin] = useState(20);
    const [labourMargin, setLabourMargin] = useState(20);
    const [gstInclusive, setGstInclusive] = useState(true);

    // Active section for adding items
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    // Pricing search
    const [pricingSearch, setPricingSearch] = useState("");
    const [pricingResults, setPricingResults] = useState<PricingItem[]>([]);
    const [showPricingDropdown, setShowPricingDropdown] = useState(false);
    const [pricingLoading, setPricingLoading] = useState(false);
    const pricingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pricingRequestIdRef = useRef(0);

    // Services
    const { data: servicesData } = useServiceOptions(open);
    const services: ServiceItem[] = useMemo(() => servicesData?.items ?? [], [servicesData]);

    // Load quote + sections + line items
    useEffect(() => {
        if (!open || !quoteId) return;
        setLoading(true);
        Promise.all([
            fetch(`/api/quotes?search=&limit=200`).then(r => r.json()),
            fetch(`/api/quote-line-items?quote_id=${quoteId}`).then(r => r.json()),
            fetch(`/api/quote-sections?quote_id=${quoteId}`).then(r => r.json()),
        ]).then(([quotesData, liData, secData]) => {
            const q = quotesData.items?.find((item: QuoteData) => item.id === quoteId);
            if (q) {
                setQuote(q);
                setScopeDescription(q.scope_description || "");
                setMaterialMargin(q.material_margin ?? 20);
                setLabourMargin(q.labour_margin ?? 20);
                setGstInclusive(q.gst_inclusive ?? true);
            }
            const secs = secData.sections || [];
            setSections(secs);
            setLineItems(liData.lineItems || []);
            setActiveSectionId(secs.length > 0 ? secs[0].id : null);
        }).catch(() => {
            toast.error("Failed to load quote data");
        }).finally(() => setLoading(false));
    }, [open, quoteId]);

    useEffect(() => () => {
        if (pricingDebounceRef.current) clearTimeout(pricingDebounceRef.current);
    }, []);

    const searchPricing = useCallback((query: string) => {
        if (pricingDebounceRef.current) clearTimeout(pricingDebounceRef.current);
        if (query.length < 3) { setPricingResults([]); setPricingLoading(false); return; }
        setPricingLoading(true);
        const requestId = ++pricingRequestIdRef.current;
        pricingDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/pricing?search=${encodeURIComponent(query)}&limit=20`);
                const data = await res.json();
                if (requestId !== pricingRequestIdRef.current) return;
                setPricingResults(data.items || []);
            } catch {
                if (requestId !== pricingRequestIdRef.current) return;
                setPricingResults([]);
            } finally {
                if (requestId === pricingRequestIdRef.current) setPricingLoading(false);
            }
        }, 150);
    }, []);

    const filteredServices = useMemo(() => {
        if (pricingSearch.length < 3) return [];
        const q = pricingSearch.toLowerCase();
        return services.filter(s => s.name.toLowerCase().includes(q));
    }, [pricingSearch, services]);

    // Group items by section
    const groupedSections = useMemo(() => {
        return sections.map(sec => ({
            ...sec,
            items: lineItems
                .filter(li => li.section_id === sec.id)
                .sort((a, b) => a.sort_order - b.sort_order),
        }));
    }, [sections, lineItems]);

    const unsectionedItems = useMemo(() =>
        lineItems.filter(li => !li.section_id).sort((a, b) => a.sort_order - b.sort_order),
    [lineItems]);

    // Calculations
    const totals = useMemo(() => {
        let materialSum = 0;
        let labourSum = 0;
        for (const li of lineItems) {
            materialSum += li.quantity * li.material_cost;
            labourSum += li.quantity * li.labour_cost;
        }
        const materialWithMargin = materialSum * (1 + materialMargin / 100);
        const labourWithMargin = labourSum * (1 + labourMargin / 100);
        const subtotal = materialWithMargin + labourWithMargin;
        const gst = gstInclusive ? subtotal / 11 : subtotal * GST_RATE;
        const grandTotal = gstInclusive ? subtotal : subtotal + gst;
        return { materialSum, labourSum, subtotal, gst, grandTotal };
    }, [lineItems, materialMargin, labourMargin, gstInclusive]);

    // Section CRUD
    const addSection = async () => {
        const name = `Section ${sections.length + 1}`;
        const sortOrder = sections.length;
        const res = await fetch("/api/quote-sections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quote_id: quoteId, name, sort_order: sortOrder }),
        });
        if (res.ok) {
            const { section } = await res.json();
            setSections(prev => [...prev, section]);
            setActiveSectionId(section.id);
        } else {
            toast.error("Failed to add section");
        }
    };

    const updateSectionName = async (sectionId: string, name: string) => {
        // Optimistic
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, name } : s));
        const res = await fetch("/api/quote-sections", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: sectionId, name }),
        });
        if (!res.ok) toast.error("Failed to rename section");
    };

    const removeSection = async (sectionId: string) => {
        setSections(prev => prev.filter(s => s.id !== sectionId));
        // Items become unsectioned
        setLineItems(prev => prev.map(li => li.section_id === sectionId ? { ...li, section_id: null } : li));
        if (activeSectionId === sectionId) {
            setActiveSectionId(sections.find(s => s.id !== sectionId)?.id ?? null);
        }
        const res = await fetch(`/api/quote-sections?id=${sectionId}`, { method: "DELETE" });
        if (!res.ok) toast.error("Failed to delete section");
    };

    const moveSectionUp = (idx: number) => {
        if (idx === 0) return;
        setSections(prev => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            // Update sort_order
            next.forEach((s, i) => {
                fetch("/api/quote-sections", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: s.id, sort_order: i }),
                });
            });
            return next;
        });
    };

    const moveSectionDown = (idx: number) => {
        if (idx >= sections.length - 1) return;
        setSections(prev => {
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            next.forEach((s, i) => {
                fetch("/api/quote-sections", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: s.id, sort_order: i }),
                });
            });
            return next;
        });
    };

    // Line item CRUD
    const addLineItem = async (item: { description: string; trade: string | null; uom: string | null; material_cost: number; labour_cost: number; pricing_matrix_id: string | null }) => {
        const sectionId = activeSectionId;
        const body = {
            quote_id: quoteId,
            section_id: sectionId,
            description: item.description,
            line_description: null,
            trade: item.trade,
            uom: item.uom,
            quantity: 1,
            material_cost: item.material_cost,
            labour_cost: item.labour_cost,
            pricing_matrix_id: item.pricing_matrix_id,
            sort_order: lineItems.filter(li => li.section_id === sectionId).length,
        };
        const res = await fetch("/api/quote-line-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            const { lineItem } = await res.json();
            setLineItems(prev => [...prev, lineItem]);
        } else {
            toast.error("Failed to add item");
        }
    };

    const addPricingItem = async (item: PricingItem) => {
        // If no sections exist, create one first
        if (sections.length === 0) {
            const res = await fetch("/api/quote-sections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quote_id: quoteId, name: "Section 1", sort_order: 0 }),
            });
            if (res.ok) {
                const { section } = await res.json();
                setSections([section]);
                setActiveSectionId(section.id);
                // Wait for state update then add item — use the section id directly
                const itemBody = {
                    quote_id: quoteId,
                    section_id: section.id,
                    description: item.Item || "Unknown Item",
                    line_description: null,
                    trade: item.Trade || null,
                    uom: item.UOM || null,
                    quantity: 1,
                    material_cost: parseNum(item.Material_Cost),
                    labour_cost: parseNum(item.Labour_Cost),
                    pricing_matrix_id: item.Matrix_ID,
                    sort_order: 0,
                };
                const itemRes = await fetch("/api/quote-line-items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(itemBody),
                });
                if (itemRes.ok) {
                    const { lineItem } = await itemRes.json();
                    setLineItems(prev => [...prev, lineItem]);
                }
            }
        } else {
            await addLineItem({
                description: item.Item || "Unknown Item",
                trade: item.Trade || null,
                uom: item.UOM || null,
                material_cost: parseNum(item.Material_Cost),
                labour_cost: parseNum(item.Labour_Cost),
                pricing_matrix_id: item.Matrix_ID,
            });
        }
        setPricingSearch("");
        setShowPricingDropdown(false);
    };

    const addServiceItem = async (svc: ServiceItem) => {
        if (sections.length === 0) {
            const res = await fetch("/api/quote-sections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quote_id: quoteId, name: "Section 1", sort_order: 0 }),
            });
            if (res.ok) {
                const { section } = await res.json();
                setSections([section]);
                setActiveSectionId(section.id);
                const itemBody = {
                    quote_id: quoteId,
                    section_id: section.id,
                    description: svc.name,
                    line_description: null,
                    trade: "Service",
                    uom: "each",
                    quantity: 1,
                    material_cost: 0,
                    labour_cost: svc.initial_value || 0,
                    pricing_matrix_id: null,
                    sort_order: 0,
                };
                const itemRes = await fetch("/api/quote-line-items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(itemBody),
                });
                if (itemRes.ok) {
                    const { lineItem } = await itemRes.json();
                    setLineItems(prev => [...prev, lineItem]);
                }
            }
        } else {
            await addLineItem({
                description: svc.name,
                trade: "Service",
                uom: "each",
                material_cost: 0,
                labour_cost: svc.initial_value || 0,
                pricing_matrix_id: null,
            });
        }
        setPricingSearch("");
        setShowPricingDropdown(false);
    };

    const updateLineItemField = async (itemId: string, field: string, value: number | string | null) => {
        // Optimistic update
        setLineItems(prev => prev.map(li => li.id === itemId ? { ...li, [field]: value } : li));
        const res = await fetch("/api/quote-line-items", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: itemId, [field]: value }),
        });
        if (!res.ok) toast.error("Failed to update item");
    };

    const removeLineItem = async (itemId: string) => {
        const removed = lineItems.find(li => li.id === itemId);
        setLineItems(prev => prev.filter(li => li.id !== itemId));
        const res = await fetch(`/api/quote-line-items?id=${itemId}`, { method: "DELETE" });
        if (!res.ok) {
            toast.error("Failed to remove item");
            if (removed) setLineItems(prev => [...prev, removed]);
        }
    };

    // Save quote-level settings and close
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/quotes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: quoteId,
                    scope_description: scopeDescription.trim() || null,
                    material_margin: materialMargin,
                    labour_margin: labourMargin,
                    gst_inclusive: gstInclusive,
                    total_amount: totals.grandTotal,
                }),
            });
            if (!res.ok) throw new Error();
            toast.success("Quote updated");
            onUpdated?.();
            onOpenChange(false);
        } catch {
            toast.error("Failed to save quote");
        } finally {
            setSaving(false);
        }
    };

    // Render a section's items table
    const renderItemsTable = (items: LineItem[], isActive: boolean) => (
        <table className="w-full text-base">
            <thead>
                <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Item</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[88px]">Qty</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Material</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Labour</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Total</th>
                    <th className="w-10" />
                </tr>
            </thead>
            <tbody>
                {items.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground/60 text-sm">
                            {isActive ? "Search above to add items" : "Click to select, then search to add items"}
                        </td>
                    </tr>
                )}
                {items.map((li) => {
                    const lineTotal = li.quantity * (li.material_cost + li.labour_cost);
                    return (
                        <tr key={li.id} className="border-b border-border/50 last:border-0">
                            <td className="px-4 py-2">
                                <input
                                    type="text"
                                    defaultValue={li.description}
                                    onBlur={(e) => {
                                        const v = e.target.value.trim();
                                        if (v && v !== li.description) updateLineItemField(li.id, "description", v);
                                    }}
                                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                    className="w-full bg-transparent font-medium text-sm focus:outline-none focus:bg-muted/40 rounded px-1 py-0.5 -ml-1 border border-transparent focus:border-border transition-colors"
                                />
                                <input
                                    type="text"
                                    defaultValue={li.line_description || ""}
                                    onBlur={(e) => {
                                        const v = e.target.value.trim() || null;
                                        if (v !== (li.line_description || null)) updateLineItemField(li.id, "line_description", v);
                                    }}
                                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                    placeholder="Add description..."
                                    className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none focus:bg-muted/40 rounded px-1 py-0.5 -ml-1 border border-transparent focus:border-border transition-colors mt-0.5 placeholder:text-muted-foreground/40"
                                />
                            </td>
                            <td className="px-4 py-3 text-right w-[88px]">
                                <InlineNumberInput value={li.quantity} onSave={(v) => updateLineItemField(li.id, "quantity", v)} />
                            </td>
                            <td className="px-4 py-3 text-right w-28">
                                <InlineNumberInput value={li.material_cost} onSave={(v) => updateLineItemField(li.id, "material_cost", v)} prefix="$" />
                            </td>
                            <td className="px-4 py-3 text-right w-28">
                                <InlineNumberInput value={li.labour_cost} onSave={(v) => updateLineItemField(li.id, "labour_cost", v)} prefix="$" />
                            </td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums w-28">
                                {formatCurrency(lineTotal)}
                            </td>
                            <td className="px-2 py-3 w-10">
                                <button type="button" onClick={() => removeLineItem(li.id)} className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Edit Quote{quote ? `: ${quote.title}` : ""}</DialogTitle>
                    <DialogDescription>Edit sections, line items, and pricing.</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
                ) : (
                    <div className="flex flex-col flex-1 min-h-0">
                        {/* Top section */}
                        <div className="px-1 space-y-4 pb-4">
                            {/* Scope description */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-muted-foreground">Scope / Description</label>
                                <textarea
                                    placeholder="Describe the scope of work..."
                                    value={scopeDescription}
                                    onChange={(e) => setScopeDescription(e.target.value)}
                                    rows={2}
                                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                />
                            </div>

                            {/* Pricing search + Add Section */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-muted-foreground">Line Items</label>
                                    <Button type="button" variant="outline" size="sm" className="rounded-lg h-7 text-xs gap-1" onClick={addSection}>
                                        <SectionIcon className="w-3.5 h-3.5" />
                                        Add Section
                                    </Button>
                                </div>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder={activeSectionId ? `Search — adding to "${sections.find(s => s.id === activeSectionId)?.name}"` : "Search materials or services..."}
                                        value={pricingSearch}
                                        onChange={(e) => {
                                            setPricingSearch(e.target.value);
                                            searchPricing(e.target.value);
                                            setShowPricingDropdown(e.target.value.length >= 3);
                                        }}
                                        onFocus={() => { if (pricingSearch.length >= 3) setShowPricingDropdown(true); }}
                                        onBlur={() => setTimeout(() => setShowPricingDropdown(false), 200)}
                                        className="rounded-xl pl-9"
                                    />
                                    {showPricingDropdown && (
                                        <div className="absolute z-50 top-full mt-1 w-full bg-background border border-border rounded-xl shadow-lg max-h-72 overflow-y-auto">
                                            {pricingLoading && filteredServices.length === 0 && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
                                            )}
                                            {filteredServices.length > 0 && (
                                                <>
                                                    <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/40 border-b border-border/50">Services</div>
                                                    {filteredServices.map(svc => (
                                                        <button key={svc.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => addServiceItem(svc)}>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-medium truncate">{svc.name}</span>
                                                                {svc.initial_value != null && <span className="text-xs text-muted-foreground shrink-0">{formatCurrency(svc.initial_value)}</span>}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {pricingResults.length > 0 && (
                                                <>
                                                    <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/40 border-b border-border/50">Materials</div>
                                                    {pricingResults.map((item) => (
                                                        <button key={item.Matrix_ID} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => addPricingItem(item)}>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="font-medium truncate block">{item.Item}</span>
                                                                    <span className="text-xs text-muted-foreground">{item.Trade}{item.Category ? ` / ${item.Category}` : ""}{item.UOM ? ` (${item.UOM})` : ""}</span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground text-right shrink-0">
                                                                    <div>Mat: {formatCurrency(parseNum(item.Material_Cost))}</div>
                                                                    <div>Lab: {formatCurrency(parseNum(item.Labour_Cost))}</div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {!pricingLoading && pricingResults.length === 0 && filteredServices.length === 0 && pricingSearch.length >= 3 && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">No items found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto min-h-0 px-1 space-y-4">
                            {sections.length === 0 && lineItems.length === 0 && (
                                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground text-sm">
                                    Click &ldquo;Add Section&rdquo; to start, then search to add items.
                                </div>
                            )}

                            {/* Sections */}
                            {groupedSections.map((section, sectionIdx) => {
                                const isActive = activeSectionId === section.id;
                                const sectionTotal = section.items.reduce((sum, li) => sum + li.quantity * (li.material_cost + li.labour_cost), 0);
                                return (
                                    <div
                                        key={section.id}
                                        className={`rounded-xl border bg-card overflow-hidden transition-colors ${isActive ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
                                        onClick={() => setActiveSectionId(section.id)}
                                    >
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/30 border-b border-border">
                                            <SectionIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <input
                                                type="text"
                                                defaultValue={section.name}
                                                onBlur={(e) => {
                                                    const v = e.target.value.trim();
                                                    if (v && v !== section.name) updateSectionName(section.id, v);
                                                }}
                                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                                className="flex-1 bg-transparent font-medium text-sm focus:outline-none focus:bg-muted/40 rounded px-1 py-0.5 -ml-1 border border-transparent focus:border-border transition-colors"
                                            />
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); moveSectionUp(sectionIdx); }} disabled={sectionIdx === 0} className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                                                    <IconChevronUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); moveSectionDown(sectionIdx); }} disabled={sectionIdx === sections.length - 1} className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                                                    <IconChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeSection(section.id); }} className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-1">
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        {renderItemsTable(section.items, isActive)}
                                        {section.items.length > 0 && (
                                            <div className="flex justify-end px-4 py-2 border-t border-border/50 bg-secondary/10">
                                                <span className="text-xs text-muted-foreground mr-2">Section total:</span>
                                                <span className="text-sm font-medium tabular-nums">{formatCurrency(sectionTotal)}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Unsectioned items (backward compat) */}
                            {unsectionedItems.length > 0 && (
                                <div className="rounded-xl border border-border bg-card overflow-hidden">
                                    <div className="px-4 py-2.5 bg-secondary/30 border-b border-border">
                                        <span className="text-sm font-medium text-muted-foreground">Unsectioned Items</span>
                                    </div>
                                    {renderItemsTable(unsectionedItems, false)}
                                </div>
                            )}

                            {/* Summary */}
                            {lineItems.length > 0 && (
                                <div className="flex justify-end">
                                    <div className="w-full max-w-[50%] rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Materials subtotal</span>
                                                <span className="tabular-nums">{formatCurrency(totals.materialSum)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Labour subtotal</span>
                                                <span className="tabular-nums">{formatCurrency(totals.labourSum)}</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-border/50 pt-3 grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-muted-foreground">Material margin</label>
                                                <div className="relative">
                                                    <Input type="number" min={0} max={100} value={materialMargin} onChange={(e) => setMaterialMargin(Number(e.target.value) || 0)} className="rounded-lg h-8 text-xs pr-7" />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-muted-foreground">Labour margin</label>
                                                <div className="relative">
                                                    <Input type="number" min={0} max={100} value={labourMargin} onChange={(e) => setLabourMargin(Number(e.target.value) || 0)} className="rounded-lg h-8 text-xs pr-7" />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t border-border/50 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <select value={gstInclusive ? "inclusive" : "exclusive"} onChange={(e) => setGstInclusive(e.target.value === "inclusive")} className="text-xs bg-transparent border border-border rounded-lg px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                                                    <option value="inclusive">GST Inclusive</option>
                                                    <option value="exclusive">GST Exclusive</option>
                                                </select>
                                                <span className="tabular-nums text-sm">{formatCurrency(totals.gst)}</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                                            <span>Grand Total</span>
                                            <span className="tabular-nums">{formatCurrency(totals.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-border px-1 shrink-0">
                            <div className="text-sm text-muted-foreground">
                                {sections.length} section{sections.length !== 1 ? "s" : ""} · {lineItems.length} item{lineItems.length !== 1 ? "s" : ""}
                                {lineItems.length > 0 && <span className="ml-2 font-medium text-foreground">{formatCurrency(totals.grandTotal)}</span>}
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save & Close"}</Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
