"use client";

import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Send, CheckCircle, AlertTriangle, XCircle, ArrowRight } from "lucide-react";

export function AuditTerminal() {
    const [inputUrl, setInputUrl] = useState("");
    const [step, setStep] = useState<'idle' | 'scanning' | 'results'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    // const bottomRef = useRef<HTMLDivElement>(null); // Removed to prevent auto-scroll

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputUrl) return;
        startScan(inputUrl);
    };

    const startScan = (url: string) => {
        setStep('scanning');
        setLogs([]);
        const steps = [
            `Conectando a ${url}...`,
            "Analizando stack tecnológico...",
            "Verificando rendimiento de carga...",
            "Detectando capacidades de IA...",
            "Midiendo cuellos de botella de conversión...",
            "Calculando ingresos perdidos...",
            "Auditoría Completa."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < steps.length) {
                setLogs(prev => [...prev, steps[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => setStep('results'), 500);
            }
        }, 800);
    };

    // Auto-scroll terminal
    // Auto-scroll terminal - DISABLED
    // useEffect(() => {
    //     if (bottomRef.current) {
    //         bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    //     }
    // }, [logs]);

    return (
        <section className="py-24 px-4 bg-black relative flex items-center justify-center">
            {/* Background Scanlines */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        ¿TU SITIO ESTÁ <span className="text-red-500">PERDIENDO DINERO?</span>
                    </h2>
                    <p className="text-white/60">Ejecuta una auditoría en vivo. Descúbrelo en segundos.</p>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/20 bg-black shadow-2xl shadow-green-900/10 font-mono">
                    {/* Terminal Header */}
                    <div className="bg-[#1a1a1a] px-4 py-2 border-b border-white/10 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <div className="ml-4 text-xs text-white/40">mi-ia-herramienta-auditoria -- v2.0.4</div>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-6 md:p-12 min-h-[400px] flex flex-col relative">

                        {/* Phase 1: Input */}
                        {step === 'idle' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 flex flex-col justify-center items-center gap-6"
                            >
                                <Terminal className="w-16 h-16 text-green-500 mb-4" />
                                <form onSubmit={handleSubmit} className="w-full max-w-md relative">
                                    <input
                                        type="text"
                                        placeholder="ingresa la url de tu sitio (ej: minegocio.com)"
                                        value={inputUrl}
                                        onChange={(e) => setInputUrl(e.target.value)}
                                        className="w-full bg-black border border-white/20 text-white px-6 py-4 rounded-full focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-center placeholder:text-white/20"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-2 bg-white text-black p-2 rounded-full hover:bg-green-400 transition-colors"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </form>
                                <p className="text-xs text-green-500/50 animate-pulse">Esperando objetivo...</p>
                            </motion.div>
                        )}

                        {/* Phase 2: Scanning */}
                        {step === 'scanning' && (
                            <div className="flex-1 text-sm md:text-base space-y-2 text-green-400/80">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <span className="text-white/30 mr-2">{">"}</span> {log}
                                    </motion.div>
                                ))}
                                {/* <div ref={bottomRef} /> */}
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="w-2 h-4 bg-green-500 inline-block align-middle ml-1"
                                />
                            </div>
                        )}

                        {/* Phase 3: Results */}
                        {step === 'results' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                            >
                                <div className="space-y-6">
                                    <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-lg">
                                        <h3 className="text-red-500 font-bold text-xl mb-1">CALIFICACIÓN: C-</h3>
                                        <p className="text-xs text-red-400">SE NECESITAN MEJORAS CRÍTICAS</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/60">Rendimiento de Carga</span>
                                            <span className="text-yellow-500 font-bold">4.2s (Lento)</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/60">Preparación para IA</span>
                                            <span className="text-red-500 font-bold">DESCONECTADO</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/60">Ingresos Perdidos Est.</span>
                                            <span className="text-white font-bold">~$4,500/mes</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="bg-white/5 p-6 rounded-lg border border-white/10 text-center">
                                        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                                        <p className="text-white/80 text-sm mb-4">
                                            Tu competencia está usando IA para capturar estos leads al instante.
                                        </p>
                                    </div>

                                    <a
                                        href={`https://wa.me/573157045653?text=Escaneé%20mi%20sitio%20(${inputUrl})%20y%20obtuve%20una%20C-.%20Ayúdame%20a%20arreglarlo.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-lg text-center flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                                    >
                                        Arreglar Esto Ahora <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>
                        )}

                    </div>
                </div>
            </div>
        </section>
    );
}
