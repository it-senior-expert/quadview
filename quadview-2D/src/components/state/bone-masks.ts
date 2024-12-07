import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface BoneMask {
  id: string;
  image: any;
}

interface BoneMasksState {
  boneMasks: BoneMask[];
}

interface BoneMasksActions {
  setBoneMasks: (boneMasks: BoneMask[]) => void;
}

export const useBoneMasksStore = create(
  immer<BoneMasksState & BoneMasksActions>((set) => ({
    boneMasks: [],
    setBoneMasks: (boneMasks) =>
      set((state) => {
        state.boneMasks = boneMasks;
      }),
  }))
);
