"use client";

import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIndustryStore } from "@/hooks/use-industry-store";

gsap.registerPlugin(ScrollTrigger);

const INDUSTRY_DATA = {
    generic: { label: "Ingresos Actuales", metric: "Ingresos", multiplier: 3, ticket: 100 },
    health: { label: "Volumen de Pacientes", metric: "Citas", multiplier: 2.5, ticket: 150 },
    retail: { label: "Ventas Mensuales", metric: "Ventas", multiplier: 4, ticket: 60 },
    finance: { label: "Crecimiento AUM", metric: "Leads", multiplier: 5, ticket: 500 },
    legal: { label: "Consultas de Casos", metric: "Retenciones", multiplier: 2, ticket: 1000 }
};

export function RoiCalculator() {
    const [visitors, setVisitors] = useState(1000);
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedIndustry } = useIndustryStore();
    const data = INDUSTRY_DATA[selectedIndustry];

    // Logic: Visitors * 0.05 (Conversion Rate) * Ticket
    const currentRevenue = visitors * 0.05 * data.ticket;
    const optimizedRevenue = currentRevenue * data.multiplier;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(val);
    };

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".roi-content", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                },
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="py-24 px-4 md:px-8 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none" />

            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16 roi-content">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">LAS MATEMÁTICAS <span className="text-green-500">NO MIENTEN.</span></h2>
                    <p className="text-white/60 text-lg">Deja de perder dinero. Mira cuánto vale una solución {selectedIndustry === 'generic' ? 'optimizada' : 'de ' + selectedIndustry}.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Controls */}
                    <GlassCard className="p-8 roi-content">
                        <div className="space-y-8">
                            <div>
                                <label className="text-white/80 font-mono text-sm mb-4 block flex justify-between">
                                    <span>VISITANTES MENSUALES</span>
                                    <span className="text-blue-400 font-bold">{visitors.toLocaleString()}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1000"
                                    max="100000"
                                    step="1000"
                                    value={visitors}
                                    onChange={(e) => setVisitors(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-xs text-white/30 mt-2 font-mono">
                                    <span>1K</span>
                                    <span>100K</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/50">Tasa de Conversión Prom.</span>
                                    <span className="font-mono text-white">5.0%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/50">Valor Prom. por {data.metric}</span>
                                    <span className="font-mono text-white">${data.ticket}</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Results */}
                    <div className="space-y-4 roi-content">
                        {/* Current Reality */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 opacity-70 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
                            <div className="flex items-center gap-4 mb-2">
                                <DollarSign className="w-5 h-5 text-gray-400" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{data.label} (Actual)</h3>
                            </div>
                            <div className="text-4xl font-bold text-gray-300 font-mono">
                                {formatCurrency(currentRevenue)}
                            </div>
                        </div>

                        {/* Future Reality */}
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-green-900/40 to-black border border-green-500/30 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-2">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                    <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest">MI-IA {selectedIndustry.toUpperCase()}</h3>
                                </div>
                                <div className="text-5xl md:text-6xl font-bold text-white font-mono tracking-tight">
                                    {formatCurrency(optimizedRevenue)}
                                </div>
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                                    <span className="animate-pulse">●</span> +{((data.multiplier - 1) * 100).toFixed(0)}% AUMENTO PROYECTADO
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
