import { create } from 'zustand';

export type IndustryType = 'generic' | 'health' | 'retail' | 'finance' | 'legal';

interface IndustryState {
    selectedIndustry: IndustryType;
    setIndustry: (industry: IndustryType) => void;
}

export const useIndustryStore = create<IndustryState>((set) => ({
    selectedIndustry: 'generic',
    setIndustry: (industry) => set({ selectedIndustry: industry }),
}));
