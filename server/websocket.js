// websocket.js
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

let clients = [];

console.log("WebSocket server running on ws://localhost:8080");

wss.on("connection", (ws) => {
  console.log("New client connected. Total:", clients.length + 1);
  clients.push(ws);

  ws.on("message", (message) => {
    const raw = message.toString();

    // Log cleanly without flooding the terminal for heartbeats
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type === "heartbeat") {
        process.stdout.write(`\r[heartbeat] ${parsed.id} — step ${parsed.step}   `);
      } else {
        console.log(`\n[${parsed.type}]`, JSON.stringify(parsed, null, 2));
      }
    } catch {
      console.log("Received (non-JSON):", raw);
    }

    // Broadcast to all OTHER clients (don't echo back to sender)
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    });
  });

  ws.on("close", () => {
    console.log("\nClient disconnected. Total:", clients.length - 1);
    clients = clients.filter((c) => c !== ws);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    clients = clients.filter((c) => c !== ws);
  });
});
