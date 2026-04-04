"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { platformTenantCreateSchema } from "@/lib/validation";

interface CreateTenantModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (tenant: Record<string, unknown>) => void;
}

export function CreateTenantModal({ open, onOpenChange, onCreated }: CreateTenantModalProps) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        company_name: "",
        slug: "",
        owner_name: "",
        owner_email: "",
        plan: "trial" as "trial" | "paid",
        max_users: 5,
    });

    const handleSlugify = (name: string) => {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 48);
        setForm((f) => ({ ...f, company_name: name, slug }));
    };

    const reset = () => {
        setForm({
            company_name: "",
            slug: "",
            owner_name: "",
            owner_email: "",
            plan: "trial",
            max_users: 5,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = platformTenantCreateSchema.safeParse(form);
        if (!validation.success) {
            const firstError = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
            toast.error(firstError || "Validation failed");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/platform-admin/tenants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Failed to create tenant");
                return;
            }

            toast.success("Tenant created successfully");
            onCreated?.(data.item);
            reset();
            onOpenChange(false);
        } catch {
            toast.error("Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Tenant</DialogTitle>
                    <DialogDescription>Create a new tenant account and owner.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Company Name *</label>
                        <Input
                            autoFocus
                            placeholder="Acme Construction"
                            value={form.company_name}
                            onChange={(e) => handleSlugify(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">URL Slug *</label>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="acme-construction"
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                className="rounded-xl"
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{form.slug || "slug"}.admin.mxdsolutions.com.au</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Owner Name *</label>
                        <Input
                            placeholder="John Smith"
                            value={form.owner_name}
                            onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Owner Email *</label>
                        <Input
                            type="email"
                            placeholder="john@acmeconstruction.com"
                            value={form.owner_email}
                            onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Plan</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, plan: "trial" }))}
                                className={`p-3 rounded-xl border text-left transition-all text-sm ${
                                    form.plan === "trial"
                                        ? "border-foreground bg-secondary font-medium"
                                        : "border-border hover:border-foreground/30"
                                }`}
                            >
                                Trial
                                <span className="block text-[11px] text-muted-foreground mt-0.5">14-day free trial</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, plan: "paid" }))}
                                className={`p-3 rounded-xl border text-left transition-all text-sm ${
                                    form.plan === "paid"
                                        ? "border-foreground bg-secondary font-medium"
                                        : "border-border hover:border-foreground/30"
                                }`}
                            >
                                Paid
                                <span className="block text-[11px] text-muted-foreground mt-0.5">No trial period</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Max Users</label>
                        <Input
                            type="number"
                            min={1}
                            max={1000}
                            value={form.max_users}
                            onChange={(e) => setForm((f) => ({ ...f, max_users: parseInt(e.target.value) || 5 }))}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!form.company_name.trim() || !form.owner_email.trim() || saving}>
                            {saving ? "Creating..." : "Create Tenant"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
