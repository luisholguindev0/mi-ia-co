"use client";

import { useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ARTICLES = [
    {
        title: "Por qué los Agentes de IA reemplazarán tu call center en 2026.",
        category: "PREDICCIÓN",
        date: "DIC 12, 2025",
        readTime: "5 MIN LECTURA"
    },
    {
        title: "La muerte del sitio web estático.",
        category: "ANÁLISIS",
        date: "DIC 10, 2025",
        readTime: "8 MIN LECTURA"
    },
    {
        title: "Velocidad en e-commerce: La regla de los 100ms.",
        category: "RENDIMIENTO",
        date: "DIC 05, 2025",
        readTime: "4 MIN LECTURA"
    },
    {
        title: "Sistemas de Diseño Líquido.",
        category: "UX/UI",
        date: "NOV 28, 2025",
        readTime: "6 MIN LECTURA"
    }
];

export function Insights() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            if (!process.env.NEXT_PUBLIC_DISABLE_ANIMATIONS) {
                const totalWidth = sliderRef.current?.scrollWidth || 0;
                const viewportWidth = window.innerWidth;

                gsap.to(sliderRef.current, {
                    x: -(totalWidth - viewportWidth + 100),
                    ease: "none",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top top",
                        end: `+=${totalWidth}`,
                        pin: true,
                        scrub: 1,
                        invalidateOnRefresh: true,
                    }
                });
            }
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative h-screen w-full overflow-hidden bg-black flex flex-col justify-center">
            <div className="absolute top-12 left-8 md:left-24 z-10">
                <h2 className="text-8xl md:text-9xl font-bold text-white/5 tracking-tighter">INSIGHTS</h2>
            </div>

            {/* Header */}
            <div className="container mx-auto px-4 md:px-8 mb-12 relative z-20">
                <div className="flex items-end justify-between border-b border-white/10 pb-8">
                    <div>
                        <span className="text-green-400 font-mono text-xs tracking-widest uppercase mb-2 block">Base de Conocimiento</span>
                        <h3 className="text-3xl md:text-5xl font-bold text-white">ANÁLISIS PROFUNDOS.</h3>
                    </div>
                    <div className="hidden md:block text-right">
                        <p className="text-white/50 text-sm max-w-xs">
                            Análisis técnico y predicciones del futuro del equipo de ingeniería de MI-IA.
                        </p>
                    </div>
                </div>
            </div>

            {/* Horizontal Slider */}
            <div ref={sliderRef} className="flex gap-8 pl-8 md:pl-24 w-max relative z-20">
                {ARTICLES.map((article, i) => (
                    <div key={i} className="w-[80vw] md:w-[600px] flex-shrink-0">
                        <GlassCard className="h-full p-8 md:p-12 hover:bg-white/5 transition-colors group cursor-pointer block">
                            <div className="flex justify-between items-start mb-12">
                                <div className="flex gap-4 text-xs font-mono text-white/40">
                                    <span className="text-green-400">{article.category}</span>
                                    <span>{article.date}</span>
                                </div>
                                <ArrowUpRight className="w-6 h-6 text-white/30 group-hover:text-white group-hover:rotate-45 transition-all" />
                            </div>

                            <h4 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-8 group-hover:text-green-400 transition-colors">
                                {article.title}
                            </h4>

                            <div className="mt-auto pt-8 border-t border-white/10 flex justify-between items-center text-sm font-mono text-white/50">
                                <span>{article.readTime}</span>
                                <span className="text-white group-hover:translate-x-2 transition-transform">LEER ARTÍCULO &rarr;</span>
                            </div>
                        </GlassCard>
                    </div>
                ))}
            </div>
        </section>
    );
}
