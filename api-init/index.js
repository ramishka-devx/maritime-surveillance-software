const WebSocket = require('ws');
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.AIS_STREAM_IO_API_KEY;

socket.onopen = function (_) {
    let subscriptionMessage = {
        Apikey: API_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        // FiltersShipMMSI: ["367719770"], // Optional!
        FilterMessageTypes: ["PositionReport", "BaseStationReport"] // Optional!
    };
    socket.send(JSON.stringify(subscriptionMessage));
};

socket.onmessage = function (event) {
    let aisMessage = JSON.parse(event.data);
    console.log(aisMessage);
};
