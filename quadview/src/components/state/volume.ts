import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface VolumeState {
  volume?: any;
}

interface VolumeActions {
  setVolume: (volume: any) => void;
}

export const useVolumeStore = create(
  immer<VolumeState & VolumeActions>((set) => ({
    volume: undefined,
    setVolume: (volume) =>
      set((state) => {
        state.volume = volume;
      }),
  }))
);
