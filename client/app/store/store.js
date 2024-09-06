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
  countdown: null,
  updateCountdown: (count) => set(() => ({ countdown: count })),
}));

export const useBidStore = create((set) => ({
  currentBid: 5,
  myTotalBidAmount: 0,
  amount: 100,
  userSocketId: null,
  setUserSocketId: (socketId) => set(() => ({ userSocketId: socketId })),
  updateBid: (newBid, newAmount) => {
    set((state) => ({
      currentBid: newBid,
      amount: newAmount,
    }));
  },
  placeBid: async (bid, amount) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) {
      console.error("Socket connection not established");
      return;
    }
    set((state) => ({
      myTotalBidAmount: amount + state.myTotalBidAmount,
    }));

    return new Promise((resolve, reject) => {
      socket.emit("placeBid", { bid, amount, name: "test" });
    });
  },
  resetMyTotalBidAmount: () => {
    set((state) => ({ myTotalBidAmount: 0 }));
  },
}));

export const useUserAccountStore = create((set) => ({
  walletAmount: 10000,
  currentBid: [],
  thisUserTickets: [],
  setWalletAmount: (value, type) =>
    set((state) => ({ walletAmount: state.walletAmount + value })),
  myBidHistory: [],
  updateMyBidHistory: (newBid) =>
    set((state) => ({ myBidHistory: [...state.myBidHistory, newBid] })),
}));
