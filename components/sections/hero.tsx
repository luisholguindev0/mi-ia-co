"use client";

import { useEffect, useState, useRef } from "react";
import { FluidBackground } from "@/components/ui/fluid-background";
import { DecryptedText } from "@/components/ui/decrypted-text";
import { GlassCard } from "@/components/ui/glass-card";
import { CtaButton } from "@/components/ui/cta-button";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IndustrySelector } from "@/components/sections/industry-selector";
import { useIndustryStore } from "@/hooks/use-industry-store";

gsap.registerPlugin(ScrollTrigger);

const HEADLINES = {
    generic: { title: "TU NEGOCIO,", subtitle: "ACTUALIZADO AL 2030", desc: "Apps Web Personalizadas y Agentes de Ventas con IA. Deja de perder clientes por sitios web lentos." },
    health: { title: "TRIAJE DE PACIENTES,", subtitle: "TOTALMENTE AUTOMATIZADO", desc: "Agentes de IA que agendan citas y responden preguntas frecuentes mientras duermes." },
    retail: { title: "CONVIERTE TRÁFICO", subtitle: "EN INGRESOS", desc: "Experiencias de compra 3D inmersivas que aumentan la conversión en un 40%." },
    finance: { title: "DATOS EN TIEMPO REAL,", subtitle: "CERO LATENCIA", desc: "Dashboards de trading de alta frecuencia con velocidad de grado institucional." },
    legal: { title: "EXPEDIENTES,", subtitle: "ORGANIZADOS AL INSTANTE", desc: "IA de análisis de documentos segura que ahorra a tu firma más de 100 horas al mes." }
};

export function Hero() {
    const [time, setTime] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const { selectedIndustry } = useIndustryStore();
    const content = HEADLINES[selectedIndustry as keyof typeof HEADLINES] || HEADLINES.generic;

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString("es-CO", { hour12: false, hour: "2-digit", minute: "2-digit" }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (contentRef.current && containerRef.current) {
                gsap.to(contentRef.current, {
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top top",
                        end: "bottom top",
                        scrub: 1,
                        pin: false,
                    },
                    scale: 2,
                    opacity: 0,
                    filter: "blur(10px)",
                    ease: "power2.inOut",
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative h-screen w-full overflow-hidden">
            {/* Fluid Background Layer */}
            <FluidBackground />

            {/* Industry Selector */}
            <IndustrySelector />

            {/* System Status - Top Left */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-8 left-8 z-20 hidden md:block"
            >
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white/60 tracking-widest uppercase">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    MI-IA OS v1.0 [EN LÍNEA]
                </div>
            </motion.div>


            {/* Content Overlay */}
            <div ref={contentRef} className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 origin-center">

                {/* Trust Badge (Top Right) */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="absolute top-8 right-8 hidden md:block"
                >
                    <GlassCard className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-white/70">
                        <span className="text-green-400 mr-2">●</span>
                        Barranquilla: {time}
                    </GlassCard>
                </motion.div>

                {/* Main Headline */}
                <div className="max-w-6xl w-full text-center space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedIndustry}
                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center"
                        >
                            <h1 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none text-white mix-blend-difference">
                                <DecryptedText text={content.title} initialDelay={0} />
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                                    <DecryptedText text={content.subtitle} initialDelay={0.2} className="text-gradient" />
                                </span>
                            </h1>
                        </motion.div>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.p
                            key={selectedIndustry + "-desc"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-mono"
                        >
                            {content.desc}
                        </motion.p>
                    </AnimatePresence>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 2.5 }}
                        className="pt-6"
                    >
                        <CtaButton />
                    </motion.div>
                </div>

            </div>

            {/* System Status - Bottom Right */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute bottom-8 right-8 z-20 hidden md:block"
            >
                <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-white/40 tracking-widest uppercase">
                    <span>LATENCIA: 12ms</span>
                    <span className="text-white/20">{"//"}</span>
                    <span>SERVIDOR: BOGOTA-1</span>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                DESPLÁZATE PARA DESCIFRAR
            </motion.div>
        </section>
    );
}
