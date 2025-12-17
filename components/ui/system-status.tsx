"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function SystemStatus() {
    const [time, setTime] = useState("");
    const [visitors, setVisitors] = useState(0);

    useEffect(() => {
        // Random visitor count
        const timeout = setTimeout(() => {
            setVisitors(Math.floor(Math.random() * (900 - 100) + 100));
        }, 0);

        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString("es-CO", { hour12: false }));
        }, 1000);
        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, []);

    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="fixed bottom-0 left-0 right-0 h-6 bg-zinc-950 border-t border-white/10 z-50 flex items-center justify-between px-4 text-[10px] font-mono text-white/50 uppercase tracking-wider"
        >
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    SISTEMA: NOMINAL
                </span>
                <span className="hidden md:inline">UBICACIÓN: BARRANQUILLA [10.9639° N, 74.7964° O]</span>
            </div>

            <div className="flex items-center gap-8">
                {/* Scrolling Ticker Effect simulation */}
                <div className="hidden md:flex gap-8 overflow-hidden">
                    <span>VISITANTES: {visitors}</span>
                    <span>PRÓXIMO ESPACIO: DISPONIBLE</span>
                    <span>LATENCIA: 12ms</span>
                </div>

                <span className="text-white">{time}</span>
            </div>
        </motion.div>
    );
}
