const WebSocket = require("ws");
const fs = require("fs");
require("dotenv").config();

// =========================
// CONFIG
// =========================
const COLLECTION_TIME_SECONDS = 120; // <-- change this
const OUTPUT_FILE = "ais_data.csv";

// =========================
// SETUP
// =========================
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

// Create CSV header
fs.writeFileSync(OUTPUT_FILE, "timestamp,mmsi,lat,lon,sog,cog,heading\n");

socket.on("open", () => {
  console.log("Connected to AISStream");

  const msg = {
    APIKey: process.env.AIS_STREAM_IO_API_KEY,
    BoundingBoxes: [
      [
        [-180, -90],
        [180, 90],
      ],
    ],
    FilterMessageTypes: ["PositionReport"],
  };

  socket.send(JSON.stringify(msg));
});

// =========================
// DATA HANDLING
// =========================
socket.on("message", (data) => {
  const msg = JSON.parse(data.toString());

  if (!msg.Message || !msg.Message.PositionReport) return;

  const p = msg.Message.PositionReport;

  const row =
    [
      new Date().toISOString(),
      p.MMSI_String || "",
      p.Latitude || "",
      p.Longitude || "",
      p.Sog || "",
      p.Cog || "",
      p.TrueHeading || "",
    ].join(",") + "\n";

  fs.appendFileSync(OUTPUT_FILE, row);
});

// =========================
// STOP AFTER N SECONDS
// =========================
setTimeout(() => {
  console.log("Collection finished.");
  socket.close();
}, COLLECTION_TIME_SECONDS * 1000);

// =========================
// ERROR HANDLING
// =========================
socket.on("error", (err) => {
  console.error("WebSocket error:", err);
});
