import { create } from "zustand";

interface UiState {
  showMatchModal: boolean;
  matchedUserId: string | null;
  setMatchModal: (show: boolean, userId?: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  showMatchModal: false,
  matchedUserId: null,
  setMatchModal: (show, userId = null) =>
    set({ showMatchModal: show, matchedUserId: userId }),
}));
