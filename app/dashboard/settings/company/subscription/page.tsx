"use client";

import { useState, useEffect } from "react";
import { IconMinus as MinusIcon, IconPlus as PlusIcon, IconUsers as UsersIcon, IconCreditCard as CreditCardIcon } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const BASE_PRICE = 249;
const PER_USER_PRICE = 49;

function calcPrice(users: number): number {
    if (users <= 1) return BASE_PRICE;
    return BASE_PRICE + (users - 1) * PER_USER_PRICE;
}

type TenantData = {
    plan?: string | null;
    status?: string | null;
    max_users?: number | null;
    trial_ends_at?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
};

export default function SubscriptionPage() {
    const [tenantData, setTenantData] = useState<TenantData | null>(null);
    const [loading, setLoading] = useState(true);
    const [userCount, setUserCount] = useState(1);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetch("/api/tenant")
            .then(res => res.json())
            .then(data => {
                setTenantData(data.tenant);
                setUserCount(data.tenant?.max_users || 1);
            })
            .finally(() => setLoading(false));
    }, []);

    const trialEnds = tenantData?.trial_ends_at ? new Date(tenantData.trial_ends_at) : null;
    const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
    const currentUsers = tenantData?.max_users || 1;
    const currentPrice = calcPrice(currentUsers);
    const newPrice = calcPrice(userCount);
    const hasChanges = userCount !== currentUsers;
    const isActive = tenantData?.plan !== "trial" && tenantData?.status === "active";

    const handleUpdatePlan = async () => {
        setUpdating(true);
        try {
            // TODO: call Stripe checkout/portal API
            // const res = await fetch("/api/billing/update", { method: "POST", body: JSON.stringify({ users: userCount }) });
            // const { url } = await res.json();
            // window.location.href = url;
            await new Promise(r => setTimeout(r, 800)); // placeholder
        } finally {
            setUpdating(false);
        }
    };

    const handleManageBilling = async () => {
        setUpdating(true);
        try {
            // TODO: redirect to Stripe billing portal
            // const res = await fetch("/api/billing/portal", { method: "POST" });
            // const { url } = await res.json();
            // window.location.href = url;
            await new Promise(r => setTimeout(r, 800)); // placeholder
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 max-w-xl animate-pulse">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-72" />
                <div className="h-40 bg-muted rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-xl">

            {/* Trial banner */}
            {daysLeft !== null && tenantData?.plan === "trial" && (
                <div className={cn(
                    "p-4 rounded-lg text-sm font-medium",
                    daysLeft <= 3 ? "bg-destructive/10 text-destructive" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                )}>
                    {daysLeft > 0
                        ? `Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Subscribe to keep your workspace active.`
                        : "Your trial has expired. Subscribe to restore access."
                    }
                </div>
            )}

            {/* Current plan */}
            <div className="border border-border rounded-2xl p-6 bg-card">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Current Plan</p>
                        <p className="text-2xl font-bold">${currentPrice.toLocaleString()}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {currentUsers === 1 ? "1 user" : `${currentUsers} users`}
                            {currentUsers > 1 && (
                                <span className="text-muted-foreground/70"> — $249 base + {currentUsers - 1} × $49</span>
                            )}
                        </p>
                    </div>
                    <span className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-lg uppercase tracking-wide",
                        isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    )}>
                        {tenantData?.status || "trial"}
                    </span>
                </div>

                {isActive && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <button
                            onClick={handleManageBilling}
                            disabled={updating}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                        >
                            <CreditCardIcon className="w-4 h-4" />
                            Manage Billing
                        </button>
                    </div>
                )}
            </div>

            {/* User count adjuster */}
            <div className="border border-border rounded-2xl p-6 bg-card space-y-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <UsersIcon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold">Adjust Users</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        $249/mo for the first user, then $49/mo per additional user.
                    </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setUserCount(c => Math.max(1, c - 1))}
                        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30"
                        disabled={userCount <= 1}
                    >
                        <MinusIcon className="w-4 h-4" />
                    </button>
                    <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-bold">{userCount}</p>
                        <p className="text-xs text-muted-foreground">{userCount === 1 ? "user" : "users"}</p>
                    </div>
                    <button
                        onClick={() => setUserCount(c => c + 1)}
                        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    <div className="ml-2 pl-4 border-l border-border/50">
                        <p className="text-2xl font-bold">${newPrice.toLocaleString()}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                        {userCount > 1 && (
                            <p className="text-xs text-muted-foreground">$249 + {userCount - 1} × $49</p>
                        )}
                    </div>
                </div>

                {/* Pricing breakdown */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Base (1 user)</span>
                        <span className="font-medium">$249/mo</span>
                    </div>
                    {userCount > 1 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{userCount - 1} additional {userCount - 1 === 1 ? "user" : "users"} × $49</span>
                            <span className="font-medium">${((userCount - 1) * PER_USER_PRICE).toLocaleString()}/mo</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border/50 font-semibold">
                        <span>Total</span>
                        <span>${newPrice.toLocaleString()}/mo</span>
                    </div>
                </div>

                <button
                    onClick={handleUpdatePlan}
                    disabled={updating || !hasChanges}
                    className="w-full px-4 py-2.5 bg-foreground text-background font-medium text-sm rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-40"
                >
                    {updating ? "Redirecting to Stripe..." : hasChanges ? `Update to ${userCount} ${userCount === 1 ? "user" : "users"} — $${newPrice}/mo` : "No changes"}
                </button>
            </div>
        </div>
    );
}
