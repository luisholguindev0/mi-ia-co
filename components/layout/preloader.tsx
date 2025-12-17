"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ScrambleText = ({ text, delay = 0 }: { text: string, delay?: number }) => {
    const [display, setDisplay] = useState("");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

    useEffect(() => {
        let iteration = 0;
        let interval: NodeJS.Timeout;

        const startScramble = setTimeout(() => {
            interval = setInterval(() => {
                setDisplay(
                    text
                        .split("")
                        .map((letter, index) => {
                            if (index < iteration) {
                                return text[index];
                            }
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join("")
                );

                if (iteration >= text.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 3;
            }, 30);
        }, delay * 1000);

        return () => {
            clearTimeout(startScramble);
            clearInterval(interval);
        };
    }, [text, delay]);

    return <span>{display}</span>;
}

export function Preloader() {
    const [progress, setProgress] = useState(0);
    const [complete, setComplete] = useState(false);
    const [dimension, setDimension] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setDimension({ width: window.innerWidth, height: window.innerHeight });

        const startTime = Date.now();
        const duration = 2500; // 2.5 seconds loading time

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);

            setProgress(newProgress);

            if (newProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => setComplete(true), 500);
            }
        }, 16);

        return () => clearInterval(interval);
    }, []);


    const slideUp = {
        initial: {
            top: 0
        },
        exit: {
            top: "-100vh",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as [number, number, number, number], delay: 0.2 }
        }
    }

    return (
        <AnimatePresence mode="wait">
            {!complete && (
                <motion.div
                    variants={slideUp}
                    initial="initial"
                    exit="exit"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black cursor-wait"
                >
                    {dimension.width > 0 && (
                        <>
                            {/* Background Details */}
                            <div className="absolute inset-0 z-0 opacity-20">
                                <div className="absolute top-10 left-10 w-2 h-2 bg-white/50 rounded-full animate-pulse" />
                                <div className="absolute top-10 right-10 w-2 h-2 bg-white/50 rounded-full animate-pulse decoration-clone" />
                                <div className="absolute bottom-10 left-10 w-2 h-2 bg-white/50 rounded-full animate-pulse" />
                                <div className="absolute bottom-10 right-10 w-2 h-2 bg-white/50 rounded-full animate-pulse" />

                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                            </div>

                            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-4">
                                {/* Main Counter */}
                                <div className="text-8xl md:text-9xl font-bold tracking-tighter text-white mb-2 font-mono flex items-baseline">
                                    <span>{Math.floor(progress)}</span>
                                    <span className="text-2xl md:text-3xl text-white/50 ml-2">%</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-[1px] bg-white/10 mb-4 relative overflow-hidden">
                                    <motion.div
                                        className="absolute top-0 left-0 h-full bg-white"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                {/* Status Text */}
                                <div className="flex justify-between w-full text-xs md:text-sm font-mono text-white/60 uppercase tracking-widest">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <ScrambleText text="System Initialization" delay={0.2} />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <ScrambleText text="Version 2.0.90" delay={0.4} />
                                    </motion.div>
                                </div>
                            </div>

                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
