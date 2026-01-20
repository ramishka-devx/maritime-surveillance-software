const WebSocket = require('ws');
const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.AIS_STREAM_IO_API_KEY;

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
