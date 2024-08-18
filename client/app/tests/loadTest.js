export function simulateUsers(numUsers = 1000) {
  const socketUrl = "http://localhost:4000"; // Adjust this to your server's URL
  const io = require("socket.io-client");

  function createUser(userId) {
    const socket = io(socketUrl);

    socket.on("connect", () => {
      //   console.log(`User ${userId} connected`);

      // Simulate joining
      socket.emit("join", { name: `User${userId}` });

      // Simulate placing a bid
      placeBid(socket, userId);
    });

    socket.on("newNumber", (data) => {
      //   console.log(`User ${userId} received new number: ${data.number}`);
      // Optionally place a new bid when a new number is drawn
      placeBid(socket, userId);
    });

    // socket.on("winNotification", (data) => {
    //   console.log(
    //     `User ${userId} won ${data.winningTicket.payout} on ${data.winningTicket.amount} ! Message: ${data.message}.`,
    //     data
    //   );
    // });

    socket.on("ticketSummary", (ticket) => {
      if (ticket)
        // Display the ticket information to the user
        displayTicketSummary(ticket);
    });

    function displayTicketSummary(ticket) {
      // Implement this function to show the ticket information in your UI
      // For example:

      console.log(`
    Ticket Summary for user ${ticket.userId}
    Ticket ID: ${ticket.ticketId}
    Total Bid Amount: ${ticket.totalBidAmount}
    Total Earnings: ${ticket.totalEarnings}
    Profit/Loss: ${ticket.profitLoss},
    

    Breakdown:
    ${ticket.breakdown
      .map(
        (subTicket) => `
      Bid: ${subTicket.bid}
      Amount: ${subTicket.amount}
      Payout: ${subTicket.payout}
      Status: ${subTicket.status}
    `
      )
      .join("\n")}
  `);

      //   console.log(ticket);
    }

    // Optionally, handle disconnection
    socket.on("disconnect", () => {
      //   console.log(`User ${userId} disconnected`);
    });
  }

  function placeBid(socket, userId) {
    const bid = Math.floor(Math.random() * 6) + 1; // Random bid between 1 and 6
    const amount = Math.floor(Math.random() * 100) + 1; // Random amount between 1 and 100
    // console.log(`User ${userId} placing bid: ${bid} for amount: ${amount}`);
    socket.emit("placeBid", { bid, amount: amount * 100, name: "robot" });
  }

  // Create numUsers users
  for (let i = 0; i < numUsers; i++) {
    createUser(i);
  }
}

// Run the simulation
