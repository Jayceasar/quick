import { create } from "zustand";

export const useAdminStore = create((set) => ({
  allMetrics: null,
  updateAllMetrics: (metrics) => set(() => ({ allMetrics: metrics })),
  currentBids: [],
  updateCurrentBids: (bids) => set(() => ({ currentBids: bids })),
}));
