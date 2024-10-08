import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { Worker } from "worker_threads";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Constants
const UPDATE_INTERVAL = 60000;
const COUNTDOWN_INTERVAL = 500;
const TARGET_PAYOUT_PERCENTAGE = 0.98; // 98% of the total bid
const VALID_BIDS = [1, 2, 3, 4, 5, 6];
const PAYOUT_MULTIPLIER = 5;
const FINANCIALS_FILE = "financials.txt";
const TRADES_FOLDER = "trades";

// Game state
let currentNumber = null;
let lastUpdate = null;
let allBidsData = [];
let countdown = UPDATE_INTERVAL / 1000;
let connectedUsers = new Map();
let allTimeUserTotalBids = 0;
let allTimeTotalEarnings = 0;
let allTimeUserPayouts = 0;
let SESSION_UNIQUE_ID = uuidv4();
let SESSION_COUNT = 0;
let totalWinningUsers = new Set();
let totalLosingUsers = new Set();
let totalWinningTickets = 0;
let totalLosingTickets = 0;

// Utility functions
function getRandomNumber(numbersToAvoid = []) {
  const availableNumbers = VALID_BIDS.filter(
    (num) => !numbersToAvoid.includes(num)
  );
  if (availableNumbers.length === 0) {
    console.warn("No available numbers to choose from!");
    return null;
  }
  return availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
}

function emitCountdown() {
  io.emit("countdown", { timeLeft: countdown });
}

function emitNewNumber(number) {
  io.emit("newNumber", {
    number,
    time: lastUpdate.toLocaleString(),
  });
}

function generateTicketId(userId) {
  return `${userId}_${SESSION_UNIQUE_ID}`;
}

async function readFinancials() {
  try {
    const data = await fs.readFile(FINANCIALS_FILE, "utf-8");
    const [bidsLine, earningsLine, payoutsLine] = data.split("\n");

    allTimeUserTotalBids =
      parseInt(bidsLine.split("=")[1].replace(/,/g, "")) || 0;
    allTimeTotalEarnings =
      parseInt(earningsLine.split("=")[1].replace(/,/g, "")) || 0;
    allTimeUserPayouts =
      parseInt(payoutsLine.split("=")[1].replace(/,/g, "")) || 0;
  } catch (err) {
    console.error("Error reading financials file:", err);
  }
}

async function updateFinancials(totalAmount, payouts) {
  allTimeUserTotalBids += totalAmount;
  allTimeTotalEarnings += totalAmount - payouts;
  allTimeUserPayouts += payouts;

  const content =
    `allTimeUserTotalBids = ${allTimeUserTotalBids.toLocaleString()},\n` +
    `allTimeTotalEarnings = ${allTimeTotalEarnings.toLocaleString()},\n` +
    `allTimeUserPayouts = ${allTimeUserPayouts.toLocaleString()},\n` +
    `sessionCount = ${SESSION_COUNT},\n` +
    `sessionUniqueID = ${SESSION_UNIQUE_ID},\n`;

  await fs.writeFile(FINANCIALS_FILE, content, "utf-8");
}

// Game logic
function countBids() {
  const counts = Object.fromEntries(VALID_BIDS.map((num) => [num, 0]));
  const amounts = Object.fromEntries(VALID_BIDS.map((num) => [num, 0]));
  const userBids = new Map();
  let totalAmount = 0;

  const bidderNames = Object.fromEntries(VALID_BIDS.map((num) => [num, []]));

  allBidsData.forEach(({ bid, amount, user, name }) => {
    if (VALID_BIDS.includes(bid)) {
      counts[bid]++;
      amounts[bid] += amount;
      totalAmount += amount;

      if (!userBids.has(user)) {
        userBids.set(user, []);
      }
      userBids.get(user).push({ bid, amount, name });

      bidderNames[bid].push(name);
    }
  });

  const bids = {};
  let closestPayout = 0;
  let payoutGroup = null;
  const targetPayout = totalAmount * TARGET_PAYOUT_PERCENTAGE;

  VALID_BIDS.forEach((bid) => {
    const payout = amounts[bid] * PAYOUT_MULTIPLIER;
    bids[bid] = {
      totalBids: counts[bid],
      totalAmount: amounts[bid],
      payout,
      bidders: bidderNames[bid],
    };

    if (payout <= targetPayout && payout > closestPayout) {
      closestPayout = payout;
      payoutGroup = bid;
    }
  });

  return {
    totalAmount,
    bids,
    payoutGroup,
    closestPayout,
    profit: totalAmount - closestPayout,
    userBids,
  };
}

async function getFinancialsReport() {
  try {
    const data = await fs.readFile(FINANCIALS_FILE, "utf-8");
    const lines = data.split("\n");
    const report = {};

    lines.forEach((line) => {
      const [key, value] = line.split("=").map((item) => item.trim());
      if (key && value) {
        report[key] = value;
      }
    });

    return {
      status: "success",
      content: report,
    };
  } catch (err) {
    console.error("Error reading financials file:", err);
    return {
      status: "error",
      message: "Failed to read financials",
    };
  }
}

function updateGame() {
  const results = countBids();
  const { payoutGroup, bids, userBids, totalAmount, closestPayout, profit } =
    results;

  const numbersToAvoid = Object.entries(bids)
    .filter(([, data]) => data.payout > results.totalAmount)
    .map(([number]) => parseInt(number));

  const newNumber =
    payoutGroup !== null && !numbersToAvoid.includes(payoutGroup)
      ? payoutGroup
      : getRandomNumber(numbersToAvoid);

  lastUpdate = new Date();
  currentNumber = newNumber;
  countdown = UPDATE_INTERVAL / 1000;
  SESSION_UNIQUE_ID = uuidv4();
  SESSION_COUNT = SESSION_COUNT + 1;

  emitSessionUniqueId();

  io.emit("result", results);
  emitNewNumber(newNumber);

  const tickets = [];
  for (const [userId, userBidData] of userBids.entries()) {
    const userTicket = generateComprehensiveTicket(
      userId,
      userBidData,
      newNumber
    );
    tickets.push(userTicket);

    const userSocket = connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit("ticketSummary", userTicket);
    }
  }

  console.log(`Generated tickets for ${tickets.length} users who placed bets`);

  // Uncomment these lines if you want to use worker threads and update financials
  /*
  const worker = new Worker("./workers/fileWorker.js", {
    workerData: {
      sessionId: SESSION_UNIQUE_ID,
      tickets,
      sessionSummary: {
        totalBids: allBidsData.length,
        totalAmount,
        profit,
        sessionId: SESSION_UNIQUE_ID,
        payout: closestPayout,
        winningNumber: newNumber,
        totalWinningUsers: totalWinningUsers.size,
        totalLosingUsers: totalLosingUsers.size,
        totalWinningTickets,
        totalLosingTickets,
      },
    },
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err);
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    } else {
      console.log("Worker completed successfully");
    }
  });

  updateFinancials(totalAmount, closestPayout);

  getFinancialsReport().then((report) => {
    io.emit("financials", report);
  });
  */

  allBidsData = [];
  totalWinningUsers.clear();
  totalLosingUsers.clear();
  totalWinningTickets = 0;
  totalLosingTickets = 0;
}

function generateComprehensiveTicket(userId, userBids, winningNumber) {
  let totalBidAmount = 0;
  let totalEarnings = 0;
  let userWon = false;
  const subTickets = [];
  let userName = "";

  userBids.forEach(({ bid, amount, name }) => {
    totalBidAmount += amount;
    const payout = amount * PAYOUT_MULTIPLIER;
    const status = bid === winningNumber ? "won" : "lost";

    if (status === "won") {
      totalEarnings += payout;
      userWon = true;
      totalWinningTickets += 1;
    } else {
      totalLosingTickets += 1;
    }

    subTickets.push({
      bid,
      amount,
      payout,
      status,
    });

    userName = name;
  });

  const profitLoss = totalEarnings - totalBidAmount;

  if (userWon) {
    totalWinningUsers.add(userId);
  } else {
    totalLosingUsers.add(userId);
  }

  return {
    userId,
    userName,
    ticketId: generateTicketId(userId),
    totalBidAmount,
    totalEarnings,
    profitLoss,
    breakdown: subTickets,
  };
}

function formatBidData(bidsData) {
  const formattedBids = VALID_BIDS.map((number) => ({
    number,
    totalBids: 0,
  }));

  bidsData.forEach((bid) => {
    const bidEntry = formattedBids.find((item) => item.number === bid.bid);
    if (bidEntry) {
      bidEntry.totalBids += 1;
    }
  });

  return formattedBids;
}

function emitAllBidsData() {
  const formattedBids = formatBidData(allBidsData);
  io.emit("allBidsData", formattedBids);
}

function emitSessionUniqueId() {
  io.emit("sessionUniqueId", SESSION_UNIQUE_ID);
}

function emitConnectedUsers() {
  const connectedUsersList = Array.from(connectedUsers.keys());
  io.emit("connectedUsers", connectedUsersList);
}

// Socket event handlers
function handleConnection(socket) {
  connectedUsers.set(socket.id, socket);
  emitConnectedUsers();

  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
    emitConnectedUsers();
  });

  socket.on("placeBid", ({ bid, amount, name }) => {
    console.log("new bid:", bid, amount, name, socket.id);
    allBidsData.push({ bid, amount, user: socket.id, name });
    emitAllBidsData();
  });

  socket.emit("newNumber", {
    number: currentNumber,
    time: lastUpdate ? lastUpdate.toLocaleString() : null,
  });

  socket.emit("countdown", { timeLeft: countdown });

  const formattedBids = formatBidData(allBidsData);
  socket.emit("allBidsData", formattedBids);
  socket.emit("sessionUniqueId", SESSION_UNIQUE_ID);
  emitConnectedUsers();
}

// Initialize game
currentNumber = getRandomNumber();
lastUpdate = new Date();
readFinancials();

// Set up intervals
setInterval(updateGame, UPDATE_INTERVAL);
setInterval(() => {
  countdown = Math.max(0, countdown - 0.5);
  emitCountdown();
}, COUNTDOWN_INTERVAL);

// Set up socket connection
io.on("connection", handleConnection);

// Express routes
app.get("/", (req, res) => {
  res.send("Welcome to the Betting Game Server");
});

app.get("/status", (req, res) => {
  res.json({
    currentNumber,
    lastUpdate: lastUpdate ? lastUpdate.toLocaleString() : null,
    connectedUsers: connectedUsers.size,
    totalBids: allBidsData.length,
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
