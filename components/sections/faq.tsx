"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
    {
        question: "¿Por qué código personalizado en vez de WordPress/Wix?",
        answer: "Velocidad, Seguridad y Escalabilidad. Las plantillas se rompen; el código escala. Arquitectamos sistemas que cargan instantáneamente y permiten control granular de cada interacción.",
    },
    {
        question: "¿Qué tan rápido pueden desplegar?",
        answer: "Los protocolos estándar toman de 2 a 4 semanas. Sprints acelerados disponibles para requerimientos de infraestructura urgentes.",
    },
    {
        question: "¿Manejan la integración de IA?",
        answer: "Sí. Entrenamos los modelos con los datos específicos de tu negocio, asegurando que hablen con la voz de tu marca y entiendan tus procesos únicos.",
    },
];

export function FAQ() {
    return (
        <section className="w-full bg-black py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-16 tracking-tighter">
                    LA INFORMACIÓN
                </h2>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <AccordionItem key={i} question={faq.question} answer={faq.answer} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function AccordionItem({ question, answer, index }: { question: string, answer: string, index: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            onClick={() => setIsOpen(!isOpen)}
            className="group cursor-pointer border-b border-white/10 pb-4"
        >
            <div className="flex justify-between items-center py-4">
                <h3 className="text-xl md:text-2xl text-white font-light group-hover:text-white/80 transition-colors">
                    <span className="font-mono text-xs text-blue-500 mr-4 align-top">0{index + 1}</span>
                    {question}
                </h3>
                <div className="relative w-6 h-6">
                    <motion.div
                        initial={false}
                        animate={{ rotate: isOpen ? 90 : 0, opacity: isOpen ? 0 : 1 }}
                        className="absolute inset-0 flex items-center justify-center text-white/50"
                    >
                        <Plus className="w-full h-full" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{ rotate: isOpen ? 0 : -90, opacity: isOpen ? 1 : 0 }}
                        className="absolute inset-0 flex items-center justify-center text-white"
                    >
                        <Minus className="w-full h-full" />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, filter: "blur(10px)" }}
                        animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
                        exit={{ height: 0, opacity: 0, filter: "blur(5px)" }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="text-white/60 text-lg leading-relaxed pb-8 pl-12">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
