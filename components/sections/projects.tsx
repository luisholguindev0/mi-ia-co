"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIndustryStore } from "@/hooks/use-industry-store";

gsap.registerPlugin(ScrollTrigger);

const ALL_PROJECTS = [
    {
        id: 1,
        industry: "finance",
        title: "APEX FINANZAS",
        description: "Dashboard de trading en tiempo real para traders algorítmicos de alta frecuencia.",
        stats: {
            client: "Apex Inc",
            stack: "Next.js + Supabase",
            result: "+400% Leads"
        },
        // Fintech/Trading
        img: "https://picsum.photos/seed/tradingchart/1200/800"
    },
    {
        id: 2,
        industry: "health",
        title: "LUMINA SALUD",
        description: "Sistema de triaje de pacientes con IA que reduce los tiempos de espera en Urgencias.",
        stats: {
            client: "Lumina Healthcare",
            stack: "Python + React",
            result: "-30% Tiempo Espera"
        },
        // Health/Medical
        img: "https://picsum.photos/seed/hospitaltech/1200/800"
    },
    {
        id: 3,
        industry: "retail",
        title: "VELOUR MODE",
        description: "Experiencia de e-commerce 3D inmersiva para una casa de moda de lujo.",
        stats: {
            client: "Velour Paris",
            stack: "Three.js + Shopify",
            result: "2.5x Conversión"
        },
        // Fashion/Luxury
        img: "https://picsum.photos/seed/parisfashion/1200/800"
    },
    {
        id: 4,
        industry: "legal",
        title: "JUSTICE IA",
        description: "Análisis automatizado de expedientes y predicción de precedentes para bufetes de abogados top.",
        stats: {
            client: "Davis & Partners",
            stack: "LangChain + Next.js",
            result: "100hrs Ahorradas/Mes"
        },
        // Legal/Law
        img: "https://picsum.photos/seed/courthouse/1200/800"
    },
];

export function Projects() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const { selectedIndustry } = useIndustryStore();

    // Sort projects so the selected industry comes first, or just show all if generic
    const projects = [...ALL_PROJECTS].sort((a, b) => {
        if (selectedIndustry === 'generic') return 0;
        if (a.industry === selectedIndustry) return -1;
        if (b.industry === selectedIndustry) return 1;
        return 0;
    });

    // Re-initialize ScrollTrigger when projects order changes
    useEffect(() => {
        let triggers: ScrollTrigger[] = [];

        const ctx = gsap.context(() => {
            // Kill old triggers first to avoid duplication/errors
            ScrollTrigger.getAll().forEach(t => {
                if ((t.vars.trigger as string)?.toString().includes("project-content")) {
                    t.kill();
                }
            });

            triggers = projects.map((_, i) => {
                return ScrollTrigger.create({
                    trigger: `#project-content-${i}`,
                    start: "top center",
                    end: "bottom center",
                    onEnter: () => setActiveIndex(i),
                    onEnterBack: () => setActiveIndex(i),
                });
            });
        }, containerRef);

        return () => {
            ctx.revert();
            triggers.forEach(t => t.kill());
        };
    }, [projects, selectedIndustry]);

    return (
        <section ref={containerRef} className="bg-black relative">
            <div className="flex flex-col md:flex-row">

                {/* Left Side: Pinned Visuals */}
                <div className="w-full md:w-1/2 h-[50vh] md:h-screen sticky top-0 flex items-center justify-center overflow-hidden border-r border-white/10">
                    <div className="relative w-full h-full">
                        {projects.map((project, i) => (
                            <div
                                key={project.id}
                                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === activeIndex ? "opacity-100" : "opacity-0"}`}
                            >
                                <Image
                                    src={project.img}
                                    alt={project.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/40" />
                            </div>
                        ))}

                        {/* Overlay Text for Visual */}
                        <div className="absolute bottom-12 left-12 z-10">
                            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
                                {projects[activeIndex].title}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Right Side: Scrolling Content */}
                <div className="w-full md:w-1/2">
                    {projects.map((project, i) => (
                        <div
                            key={project.id}
                            id={`project-content-${i}`}
                            className="min-h-screen flex flex-col justify-center p-12 md:p-24 border-b border-white/10 last:border-b-0"
                        >
                            <GlassCard className="p-8 mb-8">
                                <span className="text-xs font-mono text-green-400 uppercase tracking-widest mb-4 block">
                                    Caso de Éxito 0{i + 1} // {project.industry.toUpperCase()}
                                </span>
                                <p className="text-xl text-white/80 leading-relaxed mb-8">
                                    {project.description}
                                </p>

                                <div className="grid grid-cols-1 gap-6 border-t border-white/10 pt-8">
                                    <div>
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Cliente</p>
                                        <p className="text-white font-mono">{project.stats.client}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Stack</p>
                                        <p className="text-white font-mono">{project.stats.stack}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Resultado</p>
                                        <p className="text-green-400 font-mono text-xl font-bold">{project.stats.result}</p>
                                    </div>
                                </div>
                            </GlassCard>

                            <button className="group flex items-center gap-2 text-white text-sm font-bold uppercase tracking-widest hover:text-green-400 transition-colors">
                                Ver Caso Completo <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
