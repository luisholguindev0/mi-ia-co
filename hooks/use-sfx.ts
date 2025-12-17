"use client";

import { useSound } from "@/components/ui/sound-controller";
import { useCallback } from "react";

export function useSfx() {
    const { playHover, playClick, playHum, stopHum, isEnabled, toggleSound } = useSound();

    return {
        playHover,
        playClick,
        playHum,
        stopHum,
        isEnabled,
        toggleSound,
    };
}
