"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, Users, DollarSign, MessageSquare, Settings, BarChart2, CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const LOG_EVENTS = [
    { type: "sales", msg: "Stripe: Pago de $1,200 Recibido (Plan Empresarial)", color: "text-green-400" },
    { type: "ai", msg: "Agente IA: Llamada demo agendada con Sarah (Score Lead: 92)", color: "text-blue-400" },
    { type: "traffic", msg: "Pico de Tráfico: +43% visitantes de campaña LinkedIn", color: "text-purple-400" },
    { type: "system", msg: "Sistema: Base de datos auto-escalada para manejar carga", color: "text-yellow-400" },
    { type: "ai", msg: "Agente IA: Respondió consulta técnica sobre límites de API", color: "text-blue-400" },
    { type: "sales", msg: "CRM: Nuevo lead de alto valor detectado (Fortune 500)", color: "text-green-400" },
    { type: "email", msg: "Bot de Email: Secuencia de seguimiento iniciada para 50 leads", color: "text-white/70" },
];

export function ClientPortalDemo() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<Array<{ type: string; msg: string; color: string; timestamp: string }>>([]);

    // Live Feed Simulation - Initialize and update logs on client only to avoid hydration mismatch
    useEffect(() => {
        // Initialize with first 3 logs on mount (client-side only)
        const initialLogs = LOG_EVENTS.slice(0, 3).map(log => ({
            ...log,
            timestamp: new Date().toLocaleTimeString()
        }));
        setLogs(initialLogs);

        const interval = setInterval(() => {
            setLogs(prev => {
                const nextLog = LOG_EVENTS[Math.floor(Math.random() * LOG_EVENTS.length)];
                const newLogs = [{ ...nextLog, timestamp: new Date().toLocaleTimeString() }, ...prev];
                return newLogs.slice(0, 5); // Keep only recent 5
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (sectionRef.current && cardRef.current) {
                gsap.fromTo(cardRef.current,
                    {
                        rotationX: 45,
                        scale: 0.8,
                        z: -100,
                        transformOrigin: "center top",
                    },
                    {
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top bottom",
                            end: "center center",
                            scrub: 1,
                        },
                        rotationX: 0,
                        scale: 1,
                        z: 0,
                        ease: "power2.out",
                        immediateRender: true
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="min-h-screen py-24 bg-black overflow-hidden relative flex flex-col items-center justify-center">
            {/* Text Header */}
            <div className="text-center mb-12 z-10 px-4">
                <h2 className="text-3xl md:text-6xl font-bold text-white tracking-tighter mb-4">
                    NO SOLO OBTIENES UN SITIO WEB.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        OBTIENES UN CENTRO DE COMANDO.
                    </span>
                </h2>
                <p className="text-white/50 text-xl font-mono">
                    Analíticas en tiempo real, logs de chat de IA y seguimiento de ingresos.
                </p>
            </div>

            {/* The 3D Dashboard Mockup */}
            <div className="w-full max-w-6xl px-4 [perspective:1000px]">
                <div ref={cardRef} className="relative w-full h-[600px] md:h-auto md:aspect-video bg-[#0a0a0a] rounded-xl border border-white/10 shadow-2xl overflow-hidden group">

                    {/* Fake Sidebar */}
                    <div className="absolute top-0 left-0 w-64 h-full border-r border-white/5 bg-black/50 p-6 hidden md:block">
                        <div className="flex items-center gap-2 mb-8 text-white/80 font-bold tracking-widest">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            MI-IA INC.
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/60 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors bg-white/5 border border-white/5">
                                <BarChart2 size={18} /> Dashboard
                            </div>
                            <div className="flex items-center gap-3 text-white/60 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                                <MessageSquare size={18} /> Chats IA
                            </div>
                            <div className="flex items-center gap-3 text-white/60 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                                <Users size={18} /> CRM
                            </div>
                            <div className="flex items-center gap-3 text-white/60 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                                <DollarSign size={18} /> Ingresos
                            </div>
                            <div className="flex items-center gap-3 text-white/60 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors mt-8">
                                <Settings size={18} /> Configuración
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="ml-0 md:ml-64 p-4 md:p-8 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <h3 className="text-white text-xl font-bold">Resumen</h3>
                            <div className="flex gap-4">
                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs text-white/60 animate-pulse whitespace-nowrap">
                                    ● Estado del Sistema: EN LÍNEA
                                </div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-full min-h-0 basis-1/2">
                            <div className="md:col-span-2 bg-white/5 rounded-lg border border-white/5 relative overflow-hidden flex items-end p-4">
                                <div className="absolute top-4 left-4 text-xs text-white/40 uppercase tracking-widest">Tráfico en Vivo</div>
                                <div className="w-full h-full flex items-end justify-between gap-1 opacity-60">
                                    {/* Randomized Bars */}
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [Math.random() * 100 + "%", Math.random() * 100 + "%"] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                            className="flex-1 bg-gradient-to-t from-blue-500/20 to-purple-500/50 rounded-t-sm"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg border border-white/5 p-4 flex flex-row md:flex-col justify-between items-center md:items-start relative overflow-hidden group-hover:border-purple-500/30 transition-colors duration-500 gap-4">
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-xs text-white/40 uppercase tracking-widest whitespace-nowrap">Usuarios Activos</span>
                                    <Users className="w-4 h-4 text-purple-400 hidden md:block" />
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-white font-mono">1,248</div>
                                <div className="text-xs text-green-400 flex items-center gap-1 whitespace-nowrap">
                                    <Activity className="w-3 h-3" /> <span className="hidden sm:inline">+12% vs última hora</span><span className="inline sm:hidden">+12%</span>
                                </div>
                            </div>
                        </div>

                        {/* Live Feed - NOW INTERACTIVE */}
                        <div className="mt-4 md:mt-6 flex-1 bg-black/40 rounded-lg p-4 overflow-hidden border border-white/5 min-h-0 basis-1/2 flex flex-col">
                            <div className="text-xs text-white/40 uppercase tracking-widest mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <span>Log de Actividad IA en Vivo</span>
                                <span className="text-green-500 animate-pulse text-[10px] whitespace-nowrap flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                                    RECIBIENDO DATOS
                                </span>
                            </div>
                            <div className="space-y-3 font-mono text-xs overflow-hidden relative flex-1">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {logs.map((log, i) => (
                                        <motion.div
                                            key={`${log.msg}-${i}`}
                                            layout
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-center gap-3 text-white/80 border-l-2 border-white/5 pl-3 py-1"
                                        >
                                            <span className="text-white/30 text-[10px] min-w-[50px]">{log.timestamp}</span>
                                            <span className={`${log.color} truncate`}>{log.msg}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                            </div>
                        </div>

                    </div>

                    {/* Glow Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>
            </div>
        </section>
    );
}
