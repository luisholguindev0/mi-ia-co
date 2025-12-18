"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, Users, DollarSign, MessageSquare, Settings, BarChart2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const LOG_EVENTS = [
    { id: 1, text: "Conexión establecida con Nodo WhatsApp", type: "system" },
    { id: 2, text: "Escaneo de perfil: Lead Calificado", type: "ai" },
    { id: 3, text: "Analizando intención de compra...", type: "ai" },
    { id: 4, text: "DoctorAgent: Recomendación generada", type: "ai" },
    { id: 5, text: "CloserAgent: Enlace de pago enviado", type: "success" },
    { id: 6, text: "Lead Score actualizado: 98/100", type: "system" },
    { id: 7, text: "Notificación enviada a Luis", type: "system" }
];

export function ClientPortalDemo() {
    const [logs, setLogs] = useState<{ id: number; text: string; timestamp: string }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Live Feed Simulation - Initialize and update logs on client only to avoid hydration mismatch
    useEffect(() => {
        // Defer log initialization
        const timer = setTimeout(() => {
            const initialLogs = Array.from({ length: 5 }).map((_, i) => ({
                id: i,
                text: i === 0 ? "Conexión establecida con Nodo WhatsApp" :
                    i === 1 ? "Escaneo de perfil: Lead Calificado" :
                        i === 2 ? "Analizando intención de compra..." :
                            i === 3 ? "DoctorAgent: Recomendación generada" :
                                "CloserAgent: Enlace de pago enviado",
                timestamp: new Date().toLocaleTimeString()
            }));
            setLogs(initialLogs);
        }, 0);

        const interval = setInterval(() => {
            setLogs(prev => {
                const nextLog = LOG_EVENTS[Math.floor(Math.random() * LOG_EVENTS.length)];
                const newLogs = [{ ...nextLog, id: Date.now(), timestamp: new Date().toLocaleTimeString() }, ...prev];
                return newLogs.slice(0, 5); // Keep only recent 5
            });
        }, 2500);
        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".portal-card", {
                y: 100,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                }
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="py-24 px-4 bg-slate-950 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left side: Text */}
                    <div className="space-y-8">
                        <div className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
                            <span className="text-blue-400 text-xs font-bold tracking-[0.2em] uppercase">Control Total</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                            El Cerebro de tu <span className="text-blue-500">Operación</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed font-light">
                            Mientras tú duermes, tu IA está cerrando ventas, calificando leads y organizando tu agenda. Mira cómo se ve la automatización real.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Booking Ilimitado", icon: Settings },
                                { label: "Análisis en Vivo", icon: BarChart2 },
                                { label: "CRM Autónomo", icon: Users },
                                { label: "Multi-Agente", icon: Activity }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                    <item.icon className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm text-white/80">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right side: Mock Terminal/Dashboard */}
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-blue-500/20 blur-3xl opacity-20" />

                        <div className="relative border border-white/10 rounded-2xl bg-slate-900 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-slate-800/50 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">STATUS: ACTIVE // AI_MODE: AGGRESSIVE</div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: "Leads", val: "142", icon: Users, color: "text-blue-400" },
                                        { label: "Citas", val: "28", icon: Activity, color: "text-green-400" },
                                        { label: "Ventas", val: "$12k", icon: DollarSign, color: "text-purple-400" }
                                    ].map((stat, i) => (
                                        <div key={i} className="portal-card p-3 rounded-lg border border-white/5 bg-slate-800/30">
                                            <div className="flex justify-between items-start mb-1">
                                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                                <span className="text-[10px] text-slate-500">Hoy</span>
                                            </div>
                                            <div className="text-xl font-bold text-white">{stat.val}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Main Graph Area */}
                                <div className="portal-card h-40 rounded-lg border border-white/5 bg-slate-800/30 p-4 flex flex-col justify-end">
                                    <div className="flex items-end gap-1 h-full mb-2">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [(20 + (i * 5)) + "%", (40 + (i * 3)) + "%", (20 + (i * 5)) + "%"] }}
                                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: i * 0.1 }}
                                                className="flex-1 bg-gradient-to-t from-blue-500/20 to-purple-500/50 rounded-t-sm"
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                        <span>08:00</span>
                                        <span>12:00</span>
                                        <span>16:00</span>
                                        <span>20:00</span>
                                    </div>
                                </div>

                                {/* Terminal Feed */}
                                <div className="portal-card space-y-3 font-mono text-xs">
                                    <div className="flex items-center gap-2 text-slate-500 border-b border-white/5 pb-2">
                                        <MessageSquare className="w-3 h-3" />
                                        <span>LIVE AGENT FEED</span>
                                    </div>
                                    <div className="space-y-2 max-h-[120px] overflow-hidden">
                                        <AnimatePresence>
                                            {logs.map((log) => (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="flex justify-between items-start group"
                                                >
                                                    <div className="flex gap-2">
                                                        <span className="text-blue-500/50">{">"}</span>
                                                        <span className="text-slate-300">{log.text}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-600 tabular-nums">{log.timestamp}</span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
