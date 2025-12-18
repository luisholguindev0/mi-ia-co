"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Terminal, ExternalLink, Moon, ArrowRight, Video } from "lucide-react";

export function CommandMenu() {
    const [open, setOpen] = useState(false);

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const actions = [
        { label: "Agendar Llamada Estratégica", icon: Video, action: () => { window.open("https://wa.me/573157045653", "_blank"); setOpen(false); } },
        { label: "Ver Proyectos", icon: ExternalLink, action: () => { document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }); setOpen(false); } },
        { label: "Estado del Sistema", icon: Terminal, action: () => { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); setOpen(false); } },
        { label: "Cambiar Tema", icon: Moon, action: () => { console.log("Theme Toggle Placeholder"); setOpen(false); } },
    ];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-zinc-900/90 border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-purple-500/10"
                    >
                        <div className="flex items-center border-b border-white/5 px-4 py-3 gap-3">
                            <Command className="w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Escribe un comando o busca..."
                                className="flex-1 bg-transparent outline-none text-white placeholder:text-zinc-600 font-mono text-sm"
                                autoFocus
                            />
                            <div className="text-[10px] bg-white/10 px-2 py-1 rounded text-zinc-400 font-mono">ESC</div>
                        </div>

                        <div className="p-2">
                            <div className="text-xs font-mono text-zinc-500 px-2 py-2 mb-2 uppercase tracking-wider">Sugerencias</div>

                            {actions.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={item.action}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                                >
                                    <item.icon className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                                    <span className="flex-1 text-zinc-300 group-hover:text-white transition-colors">{item.label}</span>
                                    <ArrowRight className="w-3 h-3 text-white/0 group-hover:text-white/30 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </button>
                            ))}
                        </div>

                        <div className="bg-black/50 px-4 py-2 border-t border-white/5 flex justify-between items-center">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                <span className="text-[10px] text-zinc-600 font-mono uppercase">Interfaz Neural Activa</span>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-mono">Mi IA v1.0</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
