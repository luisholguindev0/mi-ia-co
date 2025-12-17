"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
    children: ReactNode;
    /** Whether to split text into individual characters (true) or words (false). Default: true */
    splitByChar?: boolean;
    /** Stagger delay between each element animation. Default: 0.05 */
    stagger?: number;
    /** Animation duration in seconds. Default: 0.6 */
    duration?: number;
    /** GSAP easing function. Default: "back.out(1.2)" */
    ease?: string;
    /** When scroll animation starts (ScrollTrigger format). Default: "top 90%" */
    scrollStart?: string;
    /** When scroll animation ends (for scrub mode). Default: "top 60%" */
    scrollEnd?: string;
    /** Whether to use scrub (tied to scroll) or timeline (trigger once). Default: false */
    scrub?: boolean | number;
    /** Enable blur effect during animation. Default: true */
    enableBlur?: boolean;
    /** Blur strength in pixels at start. Default: 10 */
    blurStrength?: number;
    /** Starting Y offset in pixels. Default: 50 */
    yOffset?: number;
    /** Starting X rotation in degrees (3D effect). Default: 15 */
    rotationX?: number;
    /** Starting rotation in degrees. Default: 0 */
    rotation?: number;
    /** Starting scale. Default: 0.95 */
    scale?: number;
    /** Starting opacity. Default: 0 */
    opacity?: number;
    /** Additional className for the wrapper */
    className?: string;
    /** Custom trigger element ref (defaults to the component itself) */
    triggerRef?: React.RefObject<HTMLElement>;
}

export function ScrollFloat({
    children,
    splitByChar = true,
    stagger = 0.05,
    duration = 0.6,
    ease = "back.out(1.2)",
    scrollStart = "top 90%",
    scrollEnd = "top 60%",
    scrub = false,
    enableBlur = true,
    blurStrength = 10,
    yOffset = 50,
    rotationX = 15,
    rotation = 0,
    scale = 0.95,
    opacity = 0,
    className = "",
    triggerRef,
}: ScrollFloatProps) {
    const containerRef = useRef<HTMLSpanElement>(null);
    const elementsRef = useRef<HTMLSpanElement[]>([]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clear any previous elements
        elementsRef.current = [];

        // Get text content
        const textContent = container.textContent || "";
        container.innerHTML = "";

        // Split text into elements
        const parts = splitByChar ? textContent.split("") : textContent.split(/\s+/);

        parts.forEach((part, index) => {
            const span = document.createElement("span");
            span.className = "scroll-float-char inline-block will-change-transform";
            span.style.display = "inline-block";
            span.textContent = part;

            // For word mode, add proper spacing between words
            if (!splitByChar && index < parts.length - 1) {
                span.style.marginRight = "0.3em";
            }

            // For character mode, preserve spaces
            if (splitByChar) {
                span.style.whiteSpace = "pre";
            }

            container.appendChild(span);
            elementsRef.current.push(span);
        });

        const elements = elementsRef.current;
        if (elements.length === 0) return;

        // Set initial state
        gsap.set(elements, {
            y: yOffset,
            rotationX: rotationX,
            rotation: rotation,
            scale: scale,
            opacity: opacity,
            filter: enableBlur ? `blur(${blurStrength}px)` : "none",
            transformPerspective: 1000,
            transformOrigin: "center bottom",
        });

        // Create the animation
        const animation = gsap.to(elements, {
            y: 0,
            rotationX: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            filter: enableBlur ? "blur(0px)" : "none",
            duration: duration,
            ease: ease,
            stagger: stagger,
            scrollTrigger: {
                trigger: triggerRef?.current || container,
                start: scrollStart,
                end: scrollEnd,
                scrub: scrub,
                toggleActions: scrub ? undefined : "play none none reverse",
            },
        });

        return () => {
            animation.kill();
            ScrollTrigger.getAll().forEach((trigger) => {
                if (trigger.vars.trigger === (triggerRef?.current || container)) {
                    trigger.kill();
                }
            });
        };
    }, [
        children,
        splitByChar,
        stagger,
        duration,
        ease,
        scrollStart,
        scrollEnd,
        scrub,
        enableBlur,
        blurStrength,
        yOffset,
        rotationX,
        rotation,
        scale,
        opacity,
        triggerRef,
    ]);

    return (
        <span
            ref={containerRef}
            className={`scroll-float-wrapper inline-block ${className}`}
            style={{ perspective: "1000px" }}
        >
            {children}
        </span>
    );
}
