"use client";
import React, { useEffect, useState } from "react";
import { useBidStore, useSocketStore } from "./store/store";
import { Input } from "@/components/ui/input";
import { io } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function Home() {
  const { toast } = useToast();
  const {
    socket,
    setSocket,
    serverResult,
    updateServerResult,
    allBids,
    updateAllBids,
  } = useSocketStore();
  const { currentBid, amount, updateBid, placeBid } = useBidStore();
  const digits = [
    [2, 3],
    [4, 5, 6],
    [7, 8],
  ];

  // connect to socket io
  useEffect(() => {
    // Connect to the Socket.IO server
    const socketIo = io("http://localhost:4000");

    // Set up the socket
    setSocket(socketIo);

    // send request
    socketIo.emit("join", { name: "Pirate" });

    // Listen for results
    socketIo.on("newNumber", (data) => {
      console.log(data);
      updateServerResult(data.number);
    });

    socketIo.on("newBid", (data) => {
      console.log("allBids", data);
      const { bid, amount, user } = data[data.length - 1];
      updateAllBids(data);
      toast({
        // title: "New order",
        description: `${user} bid ${amount} on ${bid}`,
        // action: <ToastAction altText="Goto schedule to undo">Undo</ToastAction>,
      });
    });

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
            <button>ohDarkknight</button>
            <button>$4000</button>
          </span>
        </div>
      </section>

      <section className=" w-full flex justify-center">
        <div className=" flex items-center justify-center p-4 text-4xl w-32 aspect-square rounded-full ring-8 ring-orange-400">
          {serverResult}
        </div>
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
              updateBid(currentBid, e.target.value);
            }}
          />
          <button
            onClick={() => {
              placeBid(currentBid, amount);
            }}
            className=" p-2 bg-white text-gray-600 rounded-lg"
          >
            Place Bid
          </button>
        </div>
      </section>
    </div>
  );
}
