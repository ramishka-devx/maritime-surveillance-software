const WebSocket = require("ws");
const config = require("./config");
const parseAIS = require("./parser");
const { processAISMessage } = require("./insert");
const {
  ensureTopic,
  publishAISMessage,
  startConsumer,
  disconnectKafka
} = require("./kafka");

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;
let socket;
let heartbeatInterval;

async function persistParsedMessage(parsed) {
  const result = await processAISMessage(parsed);
  if (result.positionsInserted > 0) {
    console.log(
      `[DB] ✓ Upserted ship ${parsed.mmsi} and inserted ${result.positionsInserted} AIS position`
    );
  } else {
    console.log(`[DB] ✓ Upserted ship ${parsed.mmsi} without position insert`);
  }
}

async function handleKafkaMessage({ message }) {
  try {
    if (!message?.value) return;

    const payload = JSON.parse(message.value.toString());
    const parsed = parseAIS(payload);
    if (!parsed) return;

    await persistParsedMessage(parsed);
  } catch (err) {
    console.error("[Kafka] Error processing queued AIS message:", err.message);
  }
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
        FilterMessageTypes: ["PositionReport", "ShipStaticData"]
      })
    );

    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, 30000);
  };

  socket.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (config.kafka.enabled) {
        await publishAISMessage(msg);
        return;
      }

      const parsed = parseAIS(msg);
      if (!parsed) return;
      await persistParsedMessage(parsed);
    } catch (err) {
      console.error(
        config.kafka.enabled ? "[AIS] Error queueing message:" : "[AIS] Error persisting message:",
        err.message
      );
    }
  };

  socket.onerror = (error) => {
    console.error("[AIS] WebSocket error:", error.message);
  };

  socket.onclose = (code) => {
    clearInterval(heartbeatInterval);
    console.warn(`[AIS] Connection closed (code: ${code}). Attempting to reconnect...`);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(
        `[AIS] Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY / 1000}s...`
      );
      setTimeout(connectToAISStream, RECONNECT_DELAY);
    } else {
      console.error("[AIS] ✗ Max reconnection attempts reached. Exiting.");
      process.exit(1);
    }
  };
}

async function start() {
  if (config.kafka.enabled) {
    await ensureTopic();
    await startConsumer(handleKafkaMessage);
    console.log("[Kafka] Queueing enabled");
  } else {
    console.log("[Kafka] Queueing disabled, using direct database writes");
  }
  connectToAISStream();
}

start().catch((err) => {
  console.error("[APP] Failed to start ingest service:", err.message);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("\n[APP] Shutting down gracefully...");
  clearInterval(heartbeatInterval);

  if (socket) {
    socket.close(1000, "Server shutdown");
  }

  if (config.kafka.enabled) {
    await disconnectKafka();
  }
  process.exit(0);
});
