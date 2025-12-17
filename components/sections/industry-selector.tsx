"use client";

import { motion } from "framer-motion";
import { Activity, ShoppingBag, DollarSign, Scale, Globe, LucideProps } from "lucide-react";
import { useIndustryStore, IndustryType } from "@/hooks/use-industry-store";
import { cn } from "@/lib/utils";

const industries: { id: IndustryType; label: string; icon: React.ComponentType<LucideProps> }[] = [
    { id: 'generic', label: 'TODOS', icon: Globe },
    { id: 'health', label: 'SALUD', icon: Activity },
    { id: 'retail', label: 'RETAIL', icon: ShoppingBag },
    { id: 'finance', label: 'FINANZAS', icon: DollarSign },
    { id: 'legal', label: 'LEGAL', icon: Scale },
];

export function IndustrySelector() {
    const { selectedIndustry, setIndustry } = useIndustryStore();

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
            className="absolute top-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
        >
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1.5 pointer-events-auto shadow-2xl shadow-green-900/10">
                <div className="flex items-center gap-1">
                    {industries.map((item) => {
                        const isActive = selectedIndustry === item.id;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setIndustry(item.id)}
                                className={cn(
                                    "relative px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold tracking-wider transition-all duration-300",
                                    isActive
                                        ? "text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-green-400 rounded-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline">{item.label}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
