"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export function Header() {
    const { isNavPulse } = useAppStore();

    return (
        <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 pointer-events-none">
            <div className="pointer-events-auto">
                <Link href="/" className="font-bold text-xl tracking-tighter mix-blend-difference text-white">
                    MI IA COLOMBIA
                </Link>
            </div>

            <div className="pointer-events-auto">
                <button
                    className={cn(
                        "px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 transition-all duration-300",
                        isNavPulse && "shadow-[0_0_20px_rgba(0,255,100,0.5)] bg-green-500/20 border-green-500/50 scale-105"
                    )}
                >
                    <MessageCircle size={18} className={cn(isNavPulse && "animate-bounce")} />
                    <span className="text-sm font-medium">WhatsApp</span>
                </button>
            </div>
        </header>
    );
}
