"use client";

import { motion, useSpring, useMotionValue } from "framer-motion";
import { useEffect } from "react";

export function GlobalSpotlight() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Offset by -200 to center the 400px circle
            mouseX.set(e.clientX - 200);
            mouseY.set(e.clientY - 200);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden mix-blend-screen"
            aria-hidden="true"
        >
            <motion.div
                className="absolute h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(120,119,198,0.15),_transparent_80%)] blur-2xl"
                style={{ x, y }}
            />
        </motion.div>
    );
}
