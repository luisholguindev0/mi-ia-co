"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false }: GlassCardProps) {
    return (
        <motion.div
            className={cn(
                "glass-panel relative overflow-hidden rounded-xl p-6",
                hoverEffect && "hover:border-white/20 transition-colors duration-300",
                className
            )}
            whileHover={hoverEffect ? { scale: 1.02 } : {}}
        >
            <div className="relative z-10 h-full w-full">{children}</div>
            {/* Optional internal shine */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity hover:opacity-100" />
        </motion.div>
    );
}
