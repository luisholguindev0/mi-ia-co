"use client";

import { motion } from "framer-motion";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useSfx } from "@/hooks/use-sfx";

export function Footer() {
    return (
        <footer className="relative h-screen w-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">

            {/* Background Loop Words */}
            <div className="absolute inset-0 flex flex-col justify-center opacity-10 select-none pointer-events-none">
                <Marquee direction={1}>MI IA COLOMBIA FUTURO AGÉNTICO</Marquee>
                <Marquee direction={-1}>ARQUITECTANDO SISTEMAS INTELIGENTES</Marquee>
                <Marquee direction={1}>RENDIMIENTO WEB DE PRÓXIMA GENERACIÓN</Marquee>
            </div>

            <div className="z-10 text-center space-y-10">
                <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                    ¿Listos para Iniciar?
                </h2>

                <a href="https://wa.me/573157045653" target="_blank" rel="noopener noreferrer">
                    <MagneticButton className="group relative px-12 py-6 bg-transparent rounded-full border border-white/20 hover:border-white/100 transition-colors uppercase font-mono tracking-widest text-lg overflow-hidden">
                        <span className="relative z-10 text-white group-hover:text-black transition-colors">Iniciar Protocolo</span>
                        <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                    </MagneticButton>
                </a>
            </div>

            <div className="absolute bottom-10 w-full flex justify-between px-10 text-xs text-white/30 font-mono uppercase items-center">
                <span>© 2024 Mi IA Colombia</span>
                <SoundToggle />
                <span>Barranquilla, CO</span>
            </div>
        </footer>
    );
}

function SoundToggle() {
    const { isEnabled, toggleSound } = useSfx();

    return (
        <button
            onClick={toggleSound}
            className="hover:text-white transition-colors"
        >
            {isEnabled ? "SONIDO: ON" : "SONIDO: OFF"}
        </button>
    );
}

function Marquee({ children, direction }: { children: string; direction: number }) {
    return (
        <div className="flex whitespace-nowrap overflow-hidden">
            <motion.div
                className="text-[10vw] md:text-[8vw] font-black leading-none text-white px-4"
                animate={{ x: direction === 1 ? [0, -1000] : [-1000, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                {children} — {children} — {children} — {children}
            </motion.div>
        </div>
    );
}
