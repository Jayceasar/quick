import { create } from "zustand";

export const useSocketStore = create((set) => ({
  socket: null,
  setSocket: (soc) => set(() => ({ socket: soc })),
  serverResult: null,
  updateServerResult: (num) => set(() => ({ serverResult: num })),
  allBids: [],
  updateAllBids: (allBids) =>
    set(() => ({
      allBids: allBids,
    })),
}));

export const useBidStore = create((set) => ({
  currentBid: 5,
  amount: 100,
  updateBid: (newBid, newAmount) =>
    set(() => ({ currentBid: newBid, amount: newAmount })),
  placeBid: async (bid, amount) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) {
      console.error("Socket connection not established");
      return;
    }

    return new Promise((resolve, reject) => {
      socket.emit("placeBid", { bid, amount });
    });
  },
}));
