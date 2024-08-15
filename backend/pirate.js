import { Server } from "socket.io";

const io = new Server(4000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

////////////////////////////////////////////////////////////////
// Constants --------------------------------

let currentNumber = getRandomNumber();
let lastUpdate = new Date().toLocaleString();
let allBidsData = [];

///////////////////
// Function to generate a random number between 0 and 9
function getRandomNumber() {
  return Math.floor(Math.random() * 10);
}

// Set up periodic broadcasting
setInterval(() => {
  const newNumber = getRandomNumber();
  const time = new Date().toLocaleString();

  currentNumber = newNumber; // Update the current number
  lastUpdate = time;

  console.log(
    "Broadcasting new number:",
    newNumber,
    "connected users:",
    io.engine.clientsCount
  );
  io.emit("newNumber", {
    number: newNumber,
    time: time,
  });
}, 60000); // 60000 milliseconds = 1 minute

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (data) => {
    console.log("User joined:", data.name);
  });

  // User bid
  socket.on("placeBid", ({ bid, amount }) => {
    console.log("User bid:", bid, amount, socket.id);
    allBidsData.push({ bid, amount, user: socket.id });
    io.emit("newBid", allBidsData);
  });

  // Immediately send a number to the newly connected client
  socket.emit("newNumber", {
    number: currentNumber,
    time: lastUpdate,
  });
});
