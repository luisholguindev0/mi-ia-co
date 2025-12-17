"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GlobalSpotlight } from "@/components/ui/global-spotlight";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export function Providers({ children }: { children: ReactNode }) {
    useEffect(() => {
        // Initialize Lenis with premium physics
        const lenis = new Lenis({
            // Duration controls how long the scroll "glide" lasts
            // Higher = more floaty, lower = snappier
            duration: 1.8,

            // Custom easing for that premium floating feel
            // This creates a smooth deceleration curve
            easing: (t) => {
                // Quintic ease out - very smooth, luxurious deceleration
                return 1 - Math.pow(1 - t, 5);
            },

            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,

            // How aggressively it interpolates - lower = smoother but slower response
            // Range: 0 to 1, default is ~0.1
            lerp: 0.08,

            // Wheel multiplier - controls scroll speed
            wheelMultiplier: 0.9,

            // Touch multiplier for mobile
            touchMultiplier: 1.5,

            // Infinite scroll (usually false for regular sites)
            infinite: false,
        });

        // ⚡ CRITICAL: Sync Lenis with GSAP ScrollTrigger
        // This is what fixes the glitchy/fighting behavior!
        lenis.on("scroll", ScrollTrigger.update);

        // Connect GSAP ticker to Lenis for smooth synchronization
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        // Tell GSAP to use Lenis's scroll position
        gsap.ticker.lagSmoothing(0);

        // Update ScrollTrigger on resize
        const handleResize = () => {
            ScrollTrigger.refresh();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            lenis.destroy();
            gsap.ticker.remove(lenis.raf);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <>
            <GlobalSpotlight />
            {children}
        </>
    );
}

