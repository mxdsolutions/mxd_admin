import React from 'react';

export function Logo() {
    return (
        <div className="flex items-center gap-2.5 group cursor-pointer transition-all duration-300">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_70%)]" />
                <span className="text-white text-xl font-normal tracking-wide" style={{ fontFamily: 'var(--font-bebas-neue)' }}>T</span>
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/20" />
            </div>
            <span className="text-2xl font-normal tracking-wide text-foreground transition-colors group-hover:text-primary pt-1" style={{ fontFamily: 'var(--font-bebas-neue)' }}>
                TRADIE
            </span>
        </div>
    );
}
