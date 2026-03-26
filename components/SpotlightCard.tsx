"use client";

import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
    children: ReactNode;
    /** CSS class names applied to the outer container */
    className?: string;
    /** Inline style overrides for the outer container */
    style?: CSSProperties;
    /** Grid cell size in px (default 24) */
    gridSize?: number;
    /** Constant spotlight radius in px (default 160) */
    constantRadius?: number;
    /** Cursor spotlight radius in px (default 120) */
    cursorRadius?: number;
    /** Grid line color (default rgba(255,255,255,0.06)) */
    gridColor?: string;
    /** Constant glow color (default rgba(255,255,255,0.08)) */
    glowColor?: string;
    /** Cursor glow color (default rgba(255,255,255,0.04)) */
    cursorGlowColor?: string;
}

/**
 * A dark card with a subtle grid background, a constant spotlight in the
 * top-right corner, and a cursor-following spotlight that reveals more grid
 * on hover. Works great for "premium" dark panels.
 */
export default function SpotlightCard({
    children,
    className = "",
    style,
    gridSize = 24,
    constantRadius = 160,
    cursorRadius = 120,
    gridColor = "rgba(255,255,255,0.06)",
    glowColor = "rgba(255,255,255,0.08)",
    cursorGlowColor = "rgba(255,255,255,0.04)",
}: SpotlightCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    const gridBg = `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`;
    const gridSz = `${gridSize}px ${gridSize}px`;

    const spotX = isHovering ? mousePos.x : 999;
    const spotY = isHovering ? mousePos.y : 999;

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => { setIsHovering(false); setMousePos({ x: -200, y: -200 }); }}
            className={cn(
                "relative overflow-hidden cursor-default bg-linear-to-br from-[hsl(0,0%,8%)] via-[hsl(0,0%,14%)] to-[hsl(0,0%,10%)]",
                className
            )}
            style={style}
        >
            {/* Constant top-right grid spotlight */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: gridBg,
                    backgroundSize: gridSz,
                    maskImage: `radial-gradient(circle ${constantRadius}px at calc(100% - 20px) 20px, black 0%, transparent 100%)`,
                    WebkitMaskImage: `radial-gradient(circle ${constantRadius}px at calc(100% - 20px) 20px, black 0%, transparent 100%)`,
                }}
            />

            {/* Constant top-right soft glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle ${constantRadius + 20}px at calc(100% - 10px) 10px, ${glowColor} 0%, transparent 100%)`,
                }}
            />

            {/* Cursor-following grid reveal */}
            <div
                className={cn(
                    "absolute inset-0 pointer-events-none transition-opacity duration-300",
                    isHovering ? "opacity-100" : "opacity-0"
                )}
                style={{
                    backgroundImage: gridBg,
                    backgroundSize: gridSz,
                    maskImage: `radial-gradient(circle ${cursorRadius}px at ${spotX}px ${spotY}px, black 0%, transparent 100%)`,
                    WebkitMaskImage: `radial-gradient(circle ${cursorRadius}px at ${spotX}px ${spotY}px, black 0%, transparent 100%)`,
                }}
            />

            {/* Cursor soft glow */}
            <div
                className={cn(
                    "absolute inset-0 pointer-events-none transition-opacity duration-300",
                    isHovering ? "opacity-100" : "opacity-0"
                )}
                style={{
                    background: `radial-gradient(circle ${constantRadius + 20}px at ${spotX}px ${spotY}px, ${cursorGlowColor} 0%, transparent 100%)`,
                }}
            />

            {/* Content (sits above the overlays) */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
