"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    SiOpenai,
    SiVercel,
    SiStripe,
    SiShopify,
    SiAmazonwebservices
} from "react-icons/si";

const BRANDS = [
    { name: "OpenAI", Icon: SiOpenai },
    { name: "Vercel", Icon: SiVercel },
    { name: "Stripe", Icon: SiStripe },
    { name: "Shopify", Icon: SiShopify },
    { name: "AWS", Icon: SiAmazonwebservices },
];

export function TrustSignals() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [contentWidth, setContentWidth] = useState(0);

    useEffect(() => {
        if (containerRef.current) {
            const firstSet = containerRef.current.querySelector(".logo-set");
            if (firstSet) {
                setContentWidth(firstSet.scrollWidth);
            }
        }
    }, []);

    const speed = 30;
    const animationDuration = contentWidth > 0 ? contentWidth / speed : 20;

    return (
        <section className="relative w-full py-12 md:py-16 bg-black overflow-hidden border-t border-white/5">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 z-10 pointer-events-none bg-gradient-to-r from-black to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-black to-transparent" />

            <div className="container mx-auto px-4 mb-8 text-center">
                <p className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-white/40 uppercase">
                    Impulsando la Infraestructura Digital de Colombia
                </p>
            </div>

            <div ref={containerRef} className="relative flex overflow-hidden h-16 items-center">
                <motion.div
                    className="flex items-center absolute"
                    animate={{
                        x: [0, -contentWidth],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: animationDuration,
                            ease: "linear",
                        },
                    }}
                    style={{ gap: 100 }}
                >
                    {/* First set */}
                    <div className="logo-set flex items-center shrink-0" style={{ gap: 100 }}>
                        {BRANDS.map((brand, i) => (
                            <div
                                key={`first-${i}`}
                                className="flex items-center justify-center opacity-30 hover:opacity-100 transition-all duration-500 hover:scale-110 cursor-pointer"
                            >
                                <brand.Icon className="h-8 md:h-10 w-auto text-white" aria-label={brand.name} />
                            </div>
                        ))}
                    </div>
                    {/* Second set (duplicate for seamless loop) */}
                    <div className="flex items-center shrink-0" style={{ gap: 100 }}>
                        {BRANDS.map((brand, i) => (
                            <div
                                key={`second-${i}`}
                                className="flex items-center justify-center opacity-30 hover:opacity-100 transition-all duration-500 hover:scale-110 cursor-pointer"
                            >
                                <brand.Icon className="h-8 md:h-10 w-auto text-white" aria-label={brand.name} />
                            </div>
                        ))}
                    </div>
                    {/* Third set for safety */}
                    <div className="flex items-center shrink-0" style={{ gap: 100 }}>
                        {BRANDS.map((brand, i) => (
                            <div
                                key={`third-${i}`}
                                className="flex items-center justify-center opacity-30 hover:opacity-100 transition-all duration-500 hover:scale-110 cursor-pointer"
                            >
                                <brand.Icon className="h-8 md:h-10 w-auto text-white" aria-label={brand.name} />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
