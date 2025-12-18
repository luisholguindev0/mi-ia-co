"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface SoundContextType {
    isEnabled: boolean;
    toggleSound: () => void;
    playHover: () => void;
    playClick: () => void;
    playHum: () => void;
    stopHum: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isEnabled, setIsEnabled] = useState(false); // Muted by default
    const [audioContext] = useState<AudioContext | null>(null);
    const humOscillator = useRef<OscillatorNode | null>(null);
    const humGain = useRef<GainNode | null>(null);

    // Resume context on first interaction if suspended
    useEffect(() => {
        const handleInteraction = () => {
            if (audioContext?.state === "suspended") {
                audioContext.resume();
            }
        };
        window.addEventListener("click", handleInteraction);
        return () => window.removeEventListener("click", handleInteraction);
    }, [audioContext]);


    const toggleSound = () => setIsEnabled(!isEnabled);

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
        if (!isEnabled || !audioContext) return;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);

        gain.gain.setValueAtTime(vol, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + duration);
    }, [isEnabled, audioContext]);

    const playHover = useCallback(() => {
        // High pitched blip
        playTone(800, "sine", 0.1, 0.05);
    }, [playTone]);

    const playClick = useCallback(() => {
        // Heavy shutter click - lower freq, distinct
        playTone(200, "square", 0.15, 0.1);
        // Maybe layer another tone for "mechanical" feel
        setTimeout(() => playTone(150, "sawtooth", 0.1, 0.05), 50);
    }, [playTone]);

    const playHum = useCallback(() => {
        if (!isEnabled || !audioContext || humOscillator.current) return;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(50, audioContext.currentTime); // Low frequency hum

        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 1); // Fade in

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        humOscillator.current = osc;
        humGain.current = gain;
    }, [isEnabled, audioContext]);

    const stopHum = useCallback(() => {
        if (!humOscillator.current || !humGain.current || !audioContext) return;

        const osc = humOscillator.current;
        const gain = humGain.current;

        // Fade out
        gain.gain.setValueAtTime(gain.gain.value, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

        setTimeout(() => {
            osc.stop();
            osc.disconnect();
            gain.disconnect();
        }, 500);

        humOscillator.current = null;
        humGain.current = null;
    }, [audioContext]);

    return (
        <SoundContext.Provider value={{ isEnabled, toggleSound, playHover, playClick, playHum, stopHum }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error("useSound must be used within a SoundProvider");
    }
    return context;
}
