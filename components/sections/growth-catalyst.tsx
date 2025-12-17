"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Scale, HeartPulse, ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

gsap.registerPlugin(ScrollTrigger);

const industries = [
    {
        id: "legal",
        title: "LEGAL & ADMIN",
        headline: "El Fin de la Burocracia",
        desc: "Auditoría de 500 contratos en 3 segundos. Lo que a un junior le toma una semana, a tu IA le toma un suspiro.",
        stat: "90% Ahorro Tiempo",
        icon: Scale,
        color: "from-amber-400 to-orange-500",
        shadow: "shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)]",
    },
    {
        id: "health",
        title: "SALUD & BIOTECH",
        headline: "Triaje Infalible",
        desc: "Atención al paciente 24/7 sin burnout. Diagnósticos preliminares instantáneos y gestión de citas automatizada.",
        stat: "24/7 Disponibilidad",
        icon: HeartPulse,
        color: "from-rose-400 to-red-500",
        shadow: "shadow-[0_0_30px_-5px_rgba(244,63,94,0.5)]",
    },
    {
        id: "retail",
        title: "RETAIL & E-COMMERCE",
        headline: "Ventas en Piloto Automático",
        desc: "Tus mesas se llenan solas. Tu inventario se predice solo. Tu caja crece sola. Atención al cliente que sí vende.",
        stat: "3x Conversión",
        icon: ShoppingBag,
        color: "from-emerald-400 to-teal-500", // Keep a bit of 'money' green here but elevated
        shadow: "shadow-[0_0_30px_-5px_rgba(52,211,153,0.5)]",
    },
];

const wordVariations = ["LIBERTAD", "TIEMPO", "CRECIMIENTO"];

export function GrowthCatalyst() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeText, setActiveText] = useState(0);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    // Text morphing logic triggers
    useEffect(() => {
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: "top 40%",
                onEnter: () => setActiveText(1), // Switching to "VENDEMOS ..."
                onLeaveBack: () => setActiveText(0),
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Cycle words when activeText is 1
    useEffect(() => {
        if (activeText === 1) {
            const interval = setInterval(() => {
                setCurrentWordIndex((prev) => (prev + 1) % wordVariations.length);
            }, 2500); // Change every 2.5 seconds
            return () => clearInterval(interval);
        } else {
            setCurrentWordIndex(0); // Reset when not visible
        }
    }, [activeText]);

    return (
        <section ref={containerRef} className="relative pt-0 pb-16 bg-black overflow-hidden">
            {/* Ambient Gold Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">

                {/* 1. The Hook: Text Morphing */}
                <div className="w-full flex flex-col items-center justify-center text-center mb-4">
                    <p className="font-mono text-amber-500/60 text-sm tracking-[0.3em] uppercase mb-6 animate-pulse">
                        TRADUCCIÓN: BINARIO → BANCARIO
                    </p>

                    <div className="relative h-20 md:h-32 overflow-hidden flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {activeText === 0 ? (
                                <motion.h2
                                    key="text-code"
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -50, opacity: 0 }}
                                    className="font-clash text-4xl md:text-7xl font-bold text-gray-500/30 tracking-tight absolute w-full"
                                >
                                    NO VENDEMOS CÓDIGO.
                                </motion.h2>
                            ) : (
                                <motion.div
                                    key="text-growth"
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -50, opacity: 0 }}
                                    className="font-clash text-4xl md:text-7xl font-bold tracking-tight absolute w-full grid grid-cols-2 gap-2 md:gap-4 items-center"
                                >
                                    <span className="text-right text-gold-shine">
                                        VENDEMOS
                                    </span>
                                    <div className="text-left relative">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={wordVariations[currentWordIndex]}
                                                initial={{ y: 40, opacity: 0, filter: "blur(10px)", rotateX: -45 }}
                                                animate={{ y: 0, opacity: 1, filter: "blur(0px)", rotateX: 0 }}
                                                exit={{ y: -40, opacity: 0, filter: "blur(10px)", rotateX: 45 }}
                                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                                className="block text-gold-shine italic font-serif leading-tight origin-left"
                                            >
                                                {wordVariations[currentWordIndex]}.
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 2. The Evidence: Industry Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-32">
                    {industries.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className="group relative"
                        >
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl",
                                item.color
                            )} />

                            <GlassCard className="h-full flex flex-col justify-between p-8 border-white/5 hover:border-amber-500/30 transition-colors duration-500">
                                <div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-amber-500/20 transition-colors duration-500">
                                            <item.icon className="w-6 h-6 text-white group-hover:text-amber-400 transition-colors" />
                                        </div>
                                        <span className="font-mono text-xs text-amber-500/50 uppercase tracking-widest border border-amber-500/10 px-2 py-1 rounded">
                                            {item.title}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-amber-200 transition-colors">
                                        {item.headline}
                                    </h3>

                                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                        {item.desc}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <span className="font-clash text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                        {item.stat}
                                    </span>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {/* 3. The Cherry: Magnetic CTA */}
                <div className="relative w-full flex justify-center pb-12">
                    <motion.a
                        href="https://wa.me/573157045653"
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group cursor-none-target" // Hook for custom cursor if present
                    >
                        <div className="absolute inset-0 bg-amber-500 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />

                        <div className="relative px-12 py-6 bg-black border border-amber-500/30 rounded-full flex items-center gap-4 group-hover:border-amber-500 transition-colors duration-300">
                            <span className="font-clash text-xl md:text-2xl font-bold text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                                Detonar Crecimiento
                            </span>
                            <ArrowRight className="w-6 h-6 text-amber-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.a>
                </div>

            </div>
        </section>
    );
}
