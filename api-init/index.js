<<<<<<< Updated upstream
const WebSocket = require('ws');
const dotenv = require('dotenv');

dotenv.config();
=======
const WebSocket = require("ws");
const config = require("./config");
const parseAIS = require("./parser");
const { insertAIS, insertAISBatch } = require("./insert");

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;
let socket;
let heartbeatInterval;
let flushInterval;
>>>>>>> Stashed changes

// Buffer configuration
const BUFFER_SIZE = 100; // Flush after 100 messages
const BUFFER_TIMEOUT = 5000; // Or after 5 seconds
let messageBuffer = [];
let lastFlushTime = Date.now();

<<<<<<< Updated upstream
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

socket.onopen = () => {
    const subscriptionMessage = {
        Apikey: API_KEY,
        BoundingBoxes: [
            [[11.652236, 83.935547], [3.513421, 84.770508 ]],
            [[12.125264, 72.070313], [4.477856, 69.257813]]
        ],
        FilterMessageTypes: ["PositionReport", "BaseStationReport"]
        // FiltersShipMMSI: ["367719770"] // optional
    };

    socket.send(JSON.stringify(subscriptionMessage));
};

socket.onmessage = (event) => {
    const aisMessage = JSON.parse(event.data);
    console.log(aisMessage);
};

socket.onerror = (err) => {
    console.error("WebSocket error:", err);
};
=======
async function flushBuffer() {
  if (messageBuffer.length === 0) return;

  const batch = [...messageBuffer];
  messageBuffer = [];

  try {
    const result = await insertAISBatch(batch);
    if (result.inserted > 0) {
      console.log(`[DB] ✓ Inserted ${result.inserted} records${result.failed > 0 ? ` (${result.failed} failed)` : ''}`);
    }
  } catch (err) {
    console.error("[DB] Error flushing buffer:", err.message);
  }

  lastFlushTime = Date.now();
}

function connectToAISStream() {
  console.log("[AIS] Attempting to connect to AIS stream...");
  socket = new WebSocket(config.ais.wsUrl);

  socket.onopen = () => {
    console.log("[AIS] ✓ Connected to AIS stream");
    reconnectAttempts = 0;

    socket.send(
      JSON.stringify({
        Apikey: config.ais.apiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport"]
      })
    );

    // Setup heartbeat to keep connection alive
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, 30000); // Ping every 30 seconds

    // Setup buffer flush timer
    clearInterval(flushInterval);
    flushInterval = setInterval(flushBuffer, BUFFER_TIMEOUT);
  };

  socket.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data);
      const data = parseAIS(msg);

      if (!data) return;

      // Add to buffer
      messageBuffer.push(data);

      // Flush if buffer is full
      if (messageBuffer.length >= BUFFER_SIZE) {
        await flushBuffer();
      }
    } catch (err) {
      console.error("[AIS] Error processing message:", err.message);
    }
  };

  socket.onerror = (error) => {
    console.error("[AIS] WebSocket error:", error.message);
  };

  socket.onclose = (code) => {
    clearInterval(heartbeatInterval);
    clearInterval(flushInterval);
    console.warn(`[AIS] Connection closed (code: ${code}). Attempting to reconnect...`);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`[AIS] Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY / 1000}s...`);
      setTimeout(connectToAISStream, RECONNECT_DELAY);
    } else {
      console.error("[AIS] ✗ Max reconnection attempts reached. Exiting.");
      process.exit(1);
    }
  };
}

// Start the AIS stream connection
connectToAISStream();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[APP] Shutting down gracefully...");
  clearInterval(heartbeatInterval);
  clearInterval(flushInterval);

  // Flush remaining messages before exit
  if (messageBuffer.length > 0) {
    console.log("[DB] Flushing remaining messages before shutdown...");
    await flushBuffer();
  }

  if (socket) {
    socket.close(1000, "Server shutdown");
  }

  process.exit(0);
});
>>>>>>> Stashed changes
