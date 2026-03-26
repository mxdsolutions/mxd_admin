import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ContentTarget = "tradie" | "homeowner";

export function ContentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [targetType, setTargetType] = useState<ContentTarget>("tradie");
    const [headline, setHeadline] = useState("");
    const [subHeadline, setSubHeadline] = useState("");
    const [content, setContent] = useState("");
    const [trades, setTrades] = useState<string[]>([]);
    const [keywords, setKeywords] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [loading, setLoading] = useState(false);

    // In a real app this would probably come from an API
    const availableTrades = [
        "Plumbing",
        "Electrical",
        "Carpentry",
        "Roofing",
        "HVAC",
        "Painting",
        "Landscaping"
    ];

    useEffect(() => {
        if (open) {
            setTargetType("tradie");
            setHeadline("");
            setSubHeadline("");
            setContent("");
            setTrades([]);
            setKeywords("");
            setCoverImage("");
        }
    }, [open]);

    if (!open) return null;

    const toggleTrade = (trade: string) => {
        setTrades(prev =>
            prev.includes(trade)
                ? prev.filter(t => t !== trade)
                : [...prev, trade]
        );
    };

    const handleSave = async () => {
        if (!headline.trim() || !content.trim()) {
            toast.error("Headline and content are required.");
            return;
        }

        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoading(false);

        toast.success("Content saved successfully.");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center py-10">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Modal */}
            <div className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4 border-b border-border/50">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Add Content</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create new content for the platform.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Target Audience Tabs */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold">Target Audience</label>
                        <div className="flex p-1 bg-secondary rounded-full w-fit">
                            <button
                                onClick={() => setTargetType("tradie")}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all",
                                    targetType === "tradie"
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/5"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Tradie
                            </button>
                            <button
                                onClick={() => setTargetType("homeowner")}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all",
                                    targetType === "homeowner"
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/5"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Homeowner
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-[6px]">
                            <label className="text-sm font-semibold">Headline <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="e.g., The Ultimate Guide to Winterizing Your Plumbing"
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                className="rounded-xl bg-secondary/30"
                            />
                        </div>

                        <div className="space-y-[6px]">
                            <label className="text-sm font-semibold">Sub-headline</label>
                            <Input
                                placeholder="A brief summary of what this content covers."
                                value={subHeadline}
                                onChange={(e) => setSubHeadline(e.target.value)}
                                className="rounded-xl bg-secondary/30"
                            />
                        </div>

                        <div className="space-y-[6px]">
                            <label className="text-sm font-semibold">Content (Rich Text) <span className="text-red-500">*</span></label>
                            {/* In a real app we'd use a rich text editor component like TipTap or Quill here */}
                            <textarea
                                placeholder="Write your content here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex min-h-[160px] w-full rounded-xl border border-input bg-secondary/30 px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-[6px]">
                                <label className="text-sm font-semibold">Cover Image URL</label>
                                <Input
                                    placeholder="https://example.com/image.jpg"
                                    value={coverImage}
                                    onChange={(e) => setCoverImage(e.target.value)}
                                    className="rounded-xl bg-secondary/30"
                                />
                            </div>

                            <div className="space-y-[6px]">
                                <label className="text-sm font-semibold">Keywords</label>
                                <Input
                                    placeholder="e.g., plumbing, winter, maintenance (comma separated)"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="rounded-xl bg-secondary/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-[6px]">
                            <label className="text-sm font-semibold">Related Trades</label>
                            <div className="flex flex-wrap gap-2">
                                {availableTrades.map(trade => (
                                    <button
                                        key={trade}
                                        onClick={() => toggleTrade(trade)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                                            trades.includes(trade)
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-secondary border-border/50 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        )}
                                    >
                                        {trade}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3 pt-6 border-t border-border/50">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 rounded-xl"
                        onClick={handleSave}
                        disabled={loading || !headline.trim() || !content.trim()}
                    >
                        {loading ? "Saving..." : "Publish Content"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
