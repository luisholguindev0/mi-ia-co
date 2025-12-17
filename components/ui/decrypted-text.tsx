"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%&";

interface DecryptedTextProps {
    text: string;
    className?: string;
    initialDelay?: number;
}

export function DecryptedText({ text, className, initialDelay = 0 }: DecryptedTextProps) {
    const [displayText, setDisplayText] = useState(text.split("").map(() => " "));
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    /* eslint-disable react-hooks/exhaustive-deps */
    const startScramble = () => {
        let iteration = 0;

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText(() =>
                text.split("").map((letter, index) => {
                    if (index < iteration) {
                        return text[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
            );

            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }

            iteration += 1 / 2;
        }, 30);
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            startScramble();
        }, initialDelay * 1000);
        return () => clearTimeout(timeout);
    }, []); // Intentional empty dependency for mount only behavior

    const handleHover = () => {
        startScramble();
    };

    return (
        <motion.span
            className={className}
            onHoverStart={handleHover}
        >
            {displayText.join("")}
        </motion.span>
    );
}
