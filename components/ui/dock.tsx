"use client";

import { motion } from "framer-motion";
import { Home, Folder, Zap, Phone, HelpCircle, Layers } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSfx } from "@/hooks/use-sfx";

const items = [
    { icon: Home, label: "Inicio", href: "/" },
    { icon: Layers, label: "Servicios", href: "#services" },
    { icon: Zap, label: "Proceso", href: "#process" },
    { icon: HelpCircle, label: "FAQ", href: "#faq" },
];

export function Dock() {
    const { playHover, playClick } = useSfx();

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex items-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50"
            >
                {items.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        onMouseEnter={playHover}
                        onClick={playClick}
                        className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group relative"
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {item.label}
                        </span>
                    </Link>
                ))}

                <div className="w-[1px] h-6 bg-white/10 mx-2" />

                <Link
                    href="https://wa.me/573157045653"
                    target="_blank"
                    onMouseEnter={playHover}
                    onClick={playClick}
                    className="relative group overflow-hidden bg-white text-black px-6 py-2 rounded-full font-bold text-sm tracking-wide flex items-center gap-2 hover:bg-gray-200 transition-colors"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        AGENDAR
                    </span>
                    {/* Pulse Effect */}
                    <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
                </Link>
            </motion.div>
        </div>
    );
}
