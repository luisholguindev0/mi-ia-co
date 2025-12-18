"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Search, PenTool, Code2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSfx } from "@/hooks/use-sfx";
import { useEffect } from "react";

const steps = [
    {
        id: 1,
        title: "DIAGNÓSTICO",
        description: "Auditoría profunda de tus cuellos de botella actuales.",
        icon: Search,
    },
    {
        id: 2,
        title: "PLANEACIÓN",
        description: "Arquitectura estratégica y cotización.",
        icon: PenTool,
    },
    {
        id: 3,
        title: "EJECUCIÓN",
        description: "Fase de desarrollo de alto nivel.",
        icon: Code2,
    },
    {
        id: 4,
        title: "DESPLIEGUE",
        description: "Lanzamiento, capacitación y entrega.",
        icon: Rocket,
    },
];

export function Process() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 80%", "end 50%"],
    });


    const { playHum, stopHum } = useSfx();

    // Play hum when section is in view
    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (v) => {
            if (v > 0 && v < 1) {
                playHum();
            } else {
                stopHum();
            }
        });
        return () => {
            unsubscribe();
            stopHum();
        }
    }, [scrollYProgress, playHum, stopHum]);

    return (
        <section className="relative w-full bg-black py-32 px-6 overflow-hidden">
            <div className="max-w-5xl mx-auto relative">
                <h2 className="text-5xl md:text-7xl font-bold text-white mb-20 text-center md:text-left tracking-tighter">
                    INICIACIÓN
                </h2>

                <div ref={containerRef} className="relative">

                    {/* THE FUSE (Vertical Line) */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-white/10 -translate-x-1/2 overflow-hidden z-0">
                        <motion.div
                            className="w-full h-full bg-gradient-to-b from-cyan-400 via-purple-500 to-cyan-400 origin-top"
                            style={{ scaleY: scrollYProgress }}
                        />
                    </div>

                    <div className="space-y-32">
                        {steps.map((step, index) => (
                            <ProcessStep
                                key={step.id}
                                step={step}
                                index={index}
                                progress={scrollYProgress}
                                totalSteps={steps.length}
                            />
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}

function ProcessStep({ step, index, progress, totalSteps }: { step: typeof steps[0], index: number, progress: MotionValue<number>, totalSteps: number }) {
    const isEven = index % 2 === 0;

    // Calculate the threshold at which this dot should activate
    // Each step occupies an equal portion of the timeline
    const activationThreshold = index / (totalSteps - 1);

    // Transform progress to dot opacity - dot lights up when progress reaches its threshold
    const dotOpacity = useTransform(progress, [activationThreshold - 0.1, activationThreshold], [0, 1]);
    const dotBoxShadow = useTransform(progress, [activationThreshold - 0.1, activationThreshold],
        ["0 0 0px 0px rgba(255,255,255,0)", "0 0 20px 2px rgba(255,255,255,0.5)"]
    );

    return (
        <div className={cn(
            "relative flex items-center md:justify-between",
            isEven ? "flex-row" : "flex-row md:flex-row-reverse"
        )}>
            {/* Timeline Dot (The Fuse Contact Point) */}
            <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10 w-3 h-3 rounded-full bg-black border border-white/20 ring-4 ring-black">
                <motion.div
                    className="w-full h-full rounded-full bg-white"
                    style={{
                        opacity: dotOpacity,
                        boxShadow: dotBoxShadow
                    }}
                />
            </div>

            {/* Spacer for mobile layout alignment */}
            <div className="w-16 md:hidden shrink-0" />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-20% 0px -20% 0px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn(
                    "w-full md:w-[45%]",
                    isEven ? "md:text-right" : "md:text-left"
                )}
            >
                <div className={cn(
                    "flex flex-col gap-2",
                    isEven ? "md:items-end" : "md:items-start"
                )}>
                    <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest mb-2">
                        0{step.id}
                    </span>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{step.title}</h3>
                    <p className="text-gray-400 font-light text-lg">{step.description}</p>
                </div>
            </motion.div>

            {/* Empty space for the other side of the timeline in desktop */}
            <div className="hidden md:block w-[45%]" />
        </div>
    );
}
