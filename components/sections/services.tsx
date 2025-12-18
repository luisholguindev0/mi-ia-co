"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, Rocket, Database } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { ScrollFloat } from "@/components/ui/scroll-float";
import { cn } from "@/lib/utils";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const services = [
    {
        id: "ai",
        title: "FUERZA LABORAL INFINITA",
        desc: "No es un chatbot. Es un empleado digital. Entrenamos Modelos de Lenguaje (LLMs) con tu data propietaria para vender, agendar y resolver problemas 24/7. Cero quejas. Cero descansos. 100% Retorno.",
        tech: "OpenAI GPT-4o • WhatsApp API • Pinecone Vector DB",
        header: "AGENTES NEURALES",
        icon: Bot,
        color: "shadow-[0_0_50px_-12px_rgba(168,85,247,0.5)] border-purple-500/30",
        glow: "bg-purple-500/20",
    },
    {
        id: "web",
        title: "ARQUITECTURA HIPERSÓNICA",
        desc: "La velocidad es confianza. Diseñamos experiencias Next.js que cargan en milisegundos. Animaciones fluidas, SEO técnico perfecto y una estética que destruye a tu competencia.",
        tech: "Next.js 16 • React Three Fiber • Vercel Edge",
        header: "WEB CINEMÁTICA",
        icon: Rocket,
        color: "shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] border-blue-500/30",
        glow: "bg-blue-500/20",
    },
    {
        id: "saas",
        title: "SISTEMAS OPERATIVOS",
        desc: "Centraliza el caos. Construimos Dashboards, CRMs y Herramientas Internas a medida. Visualiza tu flujo de caja, gestiona inventarios y automatiza operaciones complejas en una sola pantalla.",
        tech: "Supabase • Postgres • Stripe Connect",
        header: "ECOSISTEMAS SAAS",
        icon: Database,
        color: "shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)] border-emerald-500/30",
        glow: "bg-emerald-500/20",
    },
];

export function Services() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray<HTMLElement>(".service-card");

            // Calculate total scroll distance based on number of cards
            // We want each card to take some scroll distance to enter
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "+=110%", // Adjusted to 110% per user request
                    pin: true,
                    scrub: 1,
                    markers: false, // Set to true for debugging
                },
            });

            cards.forEach((card, index) => {
                // Skip animating the first card if we want it to be there initially,
                // OR animate all of them up.
                // Spec: "3 massive Service Cards slide up from the bottom, one by one"
                // Let's stagger them in.

                tl.fromTo(
                    card,
                    {
                        y: "120vh",
                        scale: 0.9,
                        opacity: 1, // Ensure visible for transform
                    },
                    {
                        y: 0,
                        scale: 1,
                        duration: 1,
                        ease: "power2.out",
                    },
                    // Overlap easier: start next animation when previous is partially done
                    // or just absolute values.
                    index * 0.8
                );
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="services" ref={containerRef} className="relative h-[110vh] bg-black z-30">
            {/* Sticky Viewport */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">

                {/* Header (Absolute Top) */}
                <div className="absolute top-8 md:top-12 lg:top-16 left-0 w-full text-center z-10 px-4">
                    <h2 className="font-clash text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter uppercase">
                        <ScrollFloat
                            splitByChar={true}
                            stagger={0.03}
                            duration={0.5}
                            ease="back.out(1.7)"
                            yOffset={60}
                            rotationX={20}
                            blurStrength={8}
                            scrollStart="top 85%"
                        >
                            Dominio Digital Total
                        </ScrollFloat>
                    </h2>
                    <p className="font-mono text-white/50 text-xs md:text-sm tracking-[0.2em] uppercase max-w-2xl mx-auto">
                        <ScrollFloat
                            splitByChar={false}
                            stagger={0.08}
                            duration={0.6}
                            ease="power3.out"
                            yOffset={30}
                            rotationX={10}
                            blurStrength={6}
                            scrollStart="top 80%"
                        >
                            Infraestructura de grado militar para empresas que no aceptan segundos lugares.
                        </ScrollFloat>
                    </p>
                </div>

                {/* The Stack Container */}
                <div ref={cardsRef} className="relative w-full max-w-[90%] md:max-w-5xl h-[70vh] md:h-[80vh] max-h-[800px] mt-20 flex justify-center items-end md:items-center">
                    {services.map((service, index) => (
                        <div
                            key={service.id}
                            className={cn(
                                "service-card absolute top-0 left-0 w-full h-full will-change-transform",
                                // Stacking context z-index to ensure order
                                "z-[calc(10+var(--index))]"
                            )}
                            style={{ "--index": index } as React.CSSProperties}
                        >
                            <GlassCard
                                className={cn(
                                    "w-full h-full flex flex-col md:flex-row p-0 overflow-hidden",
                                    "bg-black/90 backdrop-blur-2xl", // Deep opaque backing
                                    service.color, // Glow border/shadow
                                    "border border-white/10"
                                )}
                                hoverEffect={false}
                            >
                                {/* Content Split: Left (Text) */}
                                <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative z-20">
                                    <div>
                                        <span className={cn(
                                            "inline-block px-3 py-1 mb-6 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-white/5 border border-white/10",
                                        )}>
                                            {service.header}
                                        </span>
                                        <h3 className="font-clash text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.85] tracking-tight mb-8">
                                            {service.title}
                                        </h3>
                                        <p className="font-sans text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
                                            {service.desc}
                                        </p>
                                    </div>

                                    <div className="mt-8 border-t border-white/10 pt-6">
                                        <p className="font-mono text-sm text-purple-200/50">
                                            {"//"} {service.tech}
                                        </p>
                                    </div>
                                    {/* Desktop: Icon as background decoration in the content area */}
                                    <service.icon
                                        className="hidden md:block absolute right-8 bottom-8 text-white/5 w-64 h-64 lg:w-96 lg:h-96 -rotate-12 select-none pointer-events-none"
                                        strokeWidth={0.3}
                                    />
                                </div>

                                {/* Visual Split: Right (Graphic/Icon) - Hidden on Desktop, Shown on Mobile */}
                                <div className="relative w-full h-48 md:hidden overflow-hidden flex items-center justify-center bg-white/5 border-t border-white/10">
                                    {/* Massive Background Icon */}
                                    <service.icon
                                        className="absolute text-white/5 w-64 h-64 -rotate-12 blur-sm select-none"
                                        strokeWidth={0.5}
                                    />

                                    {/* Glowing Center */}
                                    <div className={cn(
                                        "absolute inset-0 opacity-20 bg-gradient-to-br from-transparent to-white/10",
                                        service.glow
                                    )} />

                                    <service.icon className="relative z-10 w-24 h-24 text-white/80 drop-shadow-2xl" strokeWidth={1} />
                                </div>

                            </GlassCard>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
