const express = require("express");
const socketio = require("socket.io")
const redis = require("redis");
const path = require("path");
const templateFunctions = require("./template-functions.js")
const database = require("./database.js");
require("dotenv").config();

// express setup.
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.locals.templateFunctions = templateFunctions;

app.use("/", express.static(path.join(__dirname, "static/favicon")));
app.use("/static", express.static(path.join(__dirname, "static")));

app.get("/", async (req, res) => {
    const response = await database.getLiveTable();
    res.render("index.pug", {response: response});
});

app.get("/contact", (req, res) => {
    res.render("contact.pug");
});

const server = app.listen(process.env.EXPRESS_PORT);

// socketio setup.
const sio = socketio(server);

sio.on("connection", async (socket) => {
    const weeklyCharts = await database.getWeeklyCharts();
    sio.emit("createCharts", weeklyCharts);
})

// redis pub-sub setup.
const sub = redis.createClient({host: process.env.HOST, port: process.env.REDIS_PORT});
sub.connect();

sub.subscribe("updateTables", (message) => {
    sio.emit("updateTables", message);
});

sub.subscribe("updateDayChart", (message) => {
    sio.emit("updateDayChart", message);
});

sub.subscribe("addDayChart", (message) => {
    sio.emit("addDayChart", message);
});

sub.subscribe("resetWeek", (message) => {
    sio.emit("resetWeek", message);
})