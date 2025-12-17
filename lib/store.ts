import { create } from 'zustand';

interface AppState {
    isNavPulse: boolean;
    triggerNavPulse: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    isNavPulse: false,
    triggerNavPulse: () => {
        set({ isNavPulse: true });
        setTimeout(() => set({ isNavPulse: false }), 1000);
    },
}));
