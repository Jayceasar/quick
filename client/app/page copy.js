"use client";
import React, { useEffect, useState } from "react";
import {
  useBidStore,
  useSocketStore,
  useUserAccountStore,
} from "./store/store";
import { Input } from "@/components/ui/input";
import { io } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { simulateUsers } from "./tests/loadTest";

export default function Home() {
  const { toast } = useToast();
  const {
    socket,
    setSocket,
    serverResult,
    updateServerResult,
    allBids,
    updateAllBids,
    countdown,
    updateCountdown,
  } = useSocketStore();
  const {
    myTotalBidAmount,
    resetMyTotalBidAmount,
    currentBid,
    amount,
    updateBid,
    placeBid,
    userSocketId,
    setUserSocketId,
  } = useBidStore();
  const { walletAmount, setWalletAmount } = useUserAccountStore();

  const digits = [[1], [2, 3], [4, 5, 6]];

  const BackendUrl =
    process.env.NODE_ENV === "production"
      ? `${process.env.BACKEND_URL}`
      : "http://localhost:4000";

  // connect to socket io
  useEffect(() => {
    // Connect to the Socket.IO server
    const socketIo = io(BackendUrl);

    // Set up the socket
    setSocket(socketIo);

    // Listen for the socket connection and store the socket ID
    socketIo.on("connect", () => {
      setUserSocketId(socketIo.id); // Store the socket ID in state
    });

    // send request
    socketIo.emit("join", { name: "test" });

    // Listen for newNumber
    socketIo.on("newNumber", (data) => {
      updateServerResult(data.number);
    });

    // listen for results
    socketIo.on("result", (data) => {
      // console.log("results", data);
      resetMyTotalBidAmount();
    });

    // listen for new bid
    socketIo.on("newBid", (data) => {
      const { bid, amount, user } = data[data.length - 1];
      updateAllBids(data);
    });

    // listen for countdown
    socketIo.on("countdown", (data) => {
      updateCountdown(data.timeLeft);
    });

    // listen for win
    socketIo.on("ticketSummary", (ticket) => {
      if (ticket && ticket.userId === socketIo.id) {
        console.log("this is your ticket", ticket);
        setWalletAmount(ticket.totalEarnings);
      }
    });

    // run simulated tests
    simulateUsers(10);

    // Clean up on unmount
    return () => {
      socketIo.disconnect();
    };
  }, []);

  return (
    <div className=" text-white  w-screen h-screen grid grid-cols-1 md:grid-cols-3 justify-center items-center  bg-gray-500">
      <section className=" header absolute top-0 left-0 w-full px-4 ">
        <div className=" w-full py-2 flex justify-between">
          <button>ogo</button>
          <span className=" text-xs flex gap-4">
            <button>ohDarkknight || {userSocketId}</button>
            <button>${walletAmount}</button>
          </span>
        </div>
      </section>

      <section className=" relative w-full h-fit  flex justify-center">
        <div className=" absolute font-bold text-5xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {serverResult}
        </div>
        <svg
          className=" absolute top-0"
          width="200"
          height="200"
          viewBox="0 0 100 100"
        >
          <path
            id="circlePath"
            d="M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0"
            stroke="#9ca3af"
            strokeWidth="4"
            fill="none"
            strokeDasharray="251.2"
            strokeDashoffset="0"
          />
        </svg>
        <svg
          className=" z-40 rotate-[90deg] transition-all"
          width="200"
          height="200"
          viewBox="0 0 100 100"
        >
          <path
            id="circlePath"
            d="M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0"
            stroke="#f97316"
            strokeWidth="4"
            fill="none"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (((countdown / 60) * 100) / 100) * 251.2}
            strokeLinecap="round"
          />
        </svg>
      </section>

      <section className=" w-full  flex flex-col items-center ">
        {digits.map((objs, i) => {
          return (
            <span
              key={i}
              className=" flex gap-8  *:w-24 *:md:w-28 *:aspect-square  *:shadow-2xl  *:rounded-full transition-all "
            >
              {objs.map((obj, j) => {
                return (
                  <button
                    className={` ${
                      currentBid === obj ? "bg-orange-500" : "bg-gray-400"
                    }  font-bold hover:bg-orange-400 hover:scale-110 transition-all`}
                    key={j}
                    onClick={() => {
                      updateBid(obj, amount);
                    }}
                  >
                    {obj}
                  </button>
                );
              })}
            </span>
          );
        })}
      </section>

      <section className="  flex flex-col gap-2 w-full items-center justify-center">
        <div className=" w-fit flex flex-col gap-3">
          <Input
            type="number"
            step="100"
            min="100"
            value={amount}
            className=" placeholder:text-white w-fit bg-gray-400 focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
            onChange={(e) => {
              updateBid(currentBid, Number(e.target.value));
            }}
          />
          <button
            onClick={() => {
              if (walletAmount > 0 && walletAmount >= amount) {
                placeBid(currentBid, amount);
                setWalletAmount(-amount);
              } else {
                toast({
                  message: "You don't have enough money",
                });
              }
            }}
            className=" p-2 bg-white text-gray-600 rounded-lg"
          >
            Place Bid
          </button>
        </div>
      </section>

      <span className=" fixed top-10 left-10">{myTotalBidAmount}</span>
    </div>
  );
}
