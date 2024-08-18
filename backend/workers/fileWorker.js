import { workerData, parentPort } from "worker_threads";
import fs from "fs/promises";
import path from "path";

const { sessionId, tickets, sessionSummary } = workerData;

async function writeTickets() {
  const folderPath = path.join("trades", sessionId);
  await fs.mkdir(folderPath, { recursive: true });

  for (const ticket of tickets) {
    const fileName = `${ticket.ticketId}.txt`;
    const filePath = path.join(folderPath, fileName);

    let content = `User ID: ${ticket.userId}\n`;
    content += `User Name: ${ticket.userName}\n`;
    content += `Ticket ID: ${ticket.ticketId}\n`;
    content += `Total Bid Amount: ${ticket.totalBidAmount}\n`;
    content += `Total Earnings: ${ticket.totalEarnings}\n`;
    content += `Profit/Loss: ${ticket.profitLoss}\n\n`;
    content += "Breakdown:\n";

    ticket.breakdown.forEach((subTicket) => {
      content += `  Bid: ${subTicket.bid}, Amount: ${subTicket.amount}, Payout: ${subTicket.payout}, Status: ${subTicket.status}\n`;
    });

    await fs.writeFile(filePath, content);
  }
}

async function writeSessionSummary() {
  const folderPath = path.join("trades", sessionId);
  const fileName = "___________session_summary.txt";
  const filePath = path.join(folderPath, fileName);

  let content = `Session ID: ${sessionSummary.sessionId}\n`;
  content += `Total Bids: ${sessionSummary.totalBids}\n`;
  content += `Total Amount: ${sessionSummary.totalAmount}\n`;
  content += `Profit: ${sessionSummary.profit}\n`;
  content += `Payout: ${sessionSummary.payout}\n`;
  content += `Winning Numbers: ${sessionSummary.winningNumber}\n`; // Changed to winningNumbers
  content += `Total Winning Users: ${sessionSummary.totalWinningUsers}\n`;
  content += `Total Losing Users: ${sessionSummary.totalLosingUsers}\n`;
  content += `Total Winning Tickets: ${sessionSummary.totalWinningTickets}\n`;
  content += `Total Losing Tickets: ${sessionSummary.totalLosingTickets}\n`;

  await fs.writeFile(filePath, content);
}

async function run() {
  try {
    await writeTickets();
    await writeSessionSummary();
    parentPort.postMessage("Files written successfully");
  } catch (error) {
    parentPort.postMessage(`Error writing files: ${error.message}`);
  }
}

run();
