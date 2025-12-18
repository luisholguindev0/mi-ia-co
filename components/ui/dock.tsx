"use client";

import { motion } from "framer-motion";
import {
    Home,
    Zap,
    Phone,
    HelpCircle,
    Layers,
    LayoutDashboard,
    BarChart3,
    Settings2,
    LogOut,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSfx } from "@/hooks/use-sfx";
import { signout } from "@/app/login/actions";

const publicItems = [
    { icon: Home, label: "Inicio", href: "/" },
    { icon: Layers, label: "Servicios", href: "/#services" },
    { icon: Zap, label: "Proceso", href: "/#process" },
    { icon: HelpCircle, label: "FAQ", href: "/#faq" },
];

const adminItems = [
    { icon: LayoutDashboard, label: "Mission Control", href: "/admin/dashboard" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Settings2, label: "Configuración", href: "/admin/settings" },
];

export function Dock() {
    const { playHover, playClick } = useSfx();
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");

    const items = isAdmin ? adminItems : publicItems;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex items-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50"
            >
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onMouseEnter={playHover}
                            onClick={playClick}
                            className={cn(
                                "p-3 rounded-full transition-all duration-300 group relative",
                                isActive
                                    ? "text-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                    : "text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {item.label}
                                {isActive && <span className="ml-1 text-[10px] text-cyan-400 opacity-70">(Active)</span>}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="dock-active"
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400"
                                />
                            )}
                        </Link>
                    );
                })}

                <div className="w-[1px] h-6 bg-white/10 mx-2" />

                {isAdmin ? (
                    <div className="flex items-center gap-2">
                        <Link
                            href="/"
                            onMouseEnter={playHover}
                            onClick={playClick}
                            className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group relative"
                        >
                            <ExternalLink className="w-5 h-5" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Ver Sitio
                            </span>
                        </Link>

                        <form action={signout}>
                            <button
                                onMouseEnter={playHover}
                                onClick={playClick}
                                className="p-3 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all duration-300 group relative"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    Cerrar Sesión
                                </span>
                            </button>
                        </form>
                    </div>
                ) : (
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
                )}
            </motion.div>
        </div>
    );
}
