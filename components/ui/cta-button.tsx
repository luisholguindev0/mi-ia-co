"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export const CtaButton = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="relative group flex items-center justify-center">
            {/* Pulsing Outer Glow (Always active) */}
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-30"
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Button Itself */}
            <motion.a
                href="https://wa.me/573157045653"
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex items-center justify-center px-8 py-4 sm:px-10 sm:py-5 overflow-hidden font-bold rounded-full group cursor-pointer border border-white/10"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* 1. Base Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-0" />

                {/* 2. Animated Gradient Stroke Effect */}
                <motion.div
                    className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent z-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />

                {/* 3. Interactive Hover Gradient Overlay */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 z-10"
                    animate={{ opacity: isHovered ? 0.8 : 0 }}
                    transition={{ duration: 0.3 }}
                />

                {/* 4. Text Content */}
                <div className="relative z-20 flex items-center gap-3 text-white uppercase tracking-widest text-sm sm:text-base">
                    <span className="font-mono font-bold">Agenda Tu Llamada</span>
                    <motion.div
                        animate={{ x: isHovered ? 4 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="bg-white text-black rounded-full p-1"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </motion.div>
                </div>

                {/* 5. Shine/Sweep Effect on Hover */}
                <motion.div
                    className="absolute inset-0 w-[400%] bg-gradient-to-r from-transparent via-white/30 to-transparent z-30 -skew-x-12"
                    initial={{ x: "-100%" }}
                    animate={{ x: isHovered ? "100%" : "-100%" }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                />
            </motion.a>
        </div>
    );
};
