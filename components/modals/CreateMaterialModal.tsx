"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CreateMaterialModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (item: Record<string, unknown>) => void;
}

export function CreateMaterialModal({ open, onOpenChange, onCreated }: CreateMaterialModalProps) {
    const [saving, setSaving] = useState(false);
    const [item, setItem] = useState("");
    const [trade, setTrade] = useState("");
    const [uom, setUom] = useState("");
    const [materialCost, setMaterialCost] = useState("");
    const [labourCost, setLabourCost] = useState("");

    const reset = () => {
        setItem("");
        setTrade("");
        setUom("");
        setMaterialCost("");
        setLabourCost("");
    };

    useEffect(() => {
        if (!open) reset();
    }, [open]);

    const materialNum = parseFloat(materialCost) || 0;
    const labourNum = parseFloat(labourCost) || 0;
    const totalRate = (materialNum + labourNum).toFixed(2);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item.trim()) { toast.error("Description is required"); return; }

        setSaving(true);
        try {
            const res = await fetch("/api/pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Item: item.trim(),
                    Trade: trade.trim() || null,
                    UOM: uom.trim() || null,
                    Material_Cost: materialCost || null,
                    Labour_Cost: labourCost || null,
                    Total_Rate: totalRate !== "0.00" ? totalRate : null,
                    Pricing_Status: "Unverified",
                }),
            });
            if (!res.ok) throw new Error("Failed to create material");
            const data = await res.json();
            toast.success("Material item created");
            onCreated?.(data.item);
            reset();
            onOpenChange(false);
        } catch {
            toast.error("Failed to create material item");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>New Material</DialogTitle>
                    <DialogDescription>Add a new pricing item to the materials list.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Description *</label>
                        <Input
                            autoFocus
                            placeholder="e.g. Plasterboard sheet 2400x1200"
                            value={item}
                            onChange={(e) => setItem(e.target.value)}
                            className="rounded-xl"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Trade</label>
                            <Input
                                placeholder="e.g. Plastering"
                                value={trade}
                                onChange={(e) => setTrade(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Unit of Measure</label>
                            <Input
                                placeholder="e.g. m2, each, lm"
                                value={uom}
                                onChange={(e) => setUom(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Material Cost</label>
                            <Input
                                placeholder="0.00"
                                value={materialCost}
                                onChange={(e) => setMaterialCost(e.target.value.replace(/[^0-9.]/g, ""))}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Labour Cost</label>
                            <Input
                                placeholder="0.00"
                                value={labourCost}
                                onChange={(e) => setLabourCost(e.target.value.replace(/[^0-9.]/g, ""))}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    {totalRate !== "0.00" && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/50 text-sm">
                            <span className="text-muted-foreground">Total Rate</span>
                            <span className="font-bold">${totalRate}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!item.trim() || saving}>
                            {saving ? "Creating..." : "Create Material"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
