"use client";

import { useEffect } from "react";
import { useAdminStore } from "./store/store";
import { io } from "socket.io-client";
import { NumberBidsData } from "./uiComponents.js/NumberBidsData";
import { AllTimeFinancials } from "./uiComponents.js/AllTimeFinancials";

export default function Home() {
  const { allMetrics, updateAllMetrics, currentBids, updateCurrentBids } =
    useAdminStore();

  // console.log(allMetrics);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = io("http://localhost:4000");

    socket.on("connect", () => {
      // console.log("connected");
    });

    socket.on("financials", (financials) => {
      if (financials.status === "success") {
        updateAllMetrics(financials.content);
      } else {
        console.error("Error:", financials.message);
      }
    });

    socket.on("allBidsData", (data) => {
      updateCurrentBids(data);
    });

    socket.on("connectedUsers", (data) => {
      // console.log("connected another user");
    });

    socket.on("sessionUniqueId", (data) => {
      // console.log(data);
    });
  }, []);

  return (
    <main className=" *:p-2 h-full min-h-screen w-screen">
      <section>Header</section>
      <section className=" flex flex-col gap-6">
        <AllTimeFinancials />
        <div className=" w-80 bg-black">
          <NumberBidsData />
        </div>
      </section>
    </main>
  );
}
