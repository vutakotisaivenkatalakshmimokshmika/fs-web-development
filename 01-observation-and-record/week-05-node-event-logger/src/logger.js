const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const LOG_FILE = path.join(__dirname, "logs", "events.log");

if (!fs.existsSync(path.join(__dirname, "logs"))) {
  fs.mkdirSync(path.join(__dirname, "logs"));
}

class LogEmitter extends EventEmitter {}

function startLogging() {
  const emitter = new LogEmitter();

  emitter.on("log", (message) => {
    fs.appendFileSync(
      LOG_FILE,
      `[${uuidv4()}] ${new Date().toISOString()} \u2014 ${message}\n`
    );
  });

  let count = 0;
  const interval = setInterval(() => {
    count++;
    emitter.emit("log", "Event fired");
    if (count === 5) {
      clearInterval(interval);
      emitter.emit("done");
    }
  }, 2000);

  return emitter;
}

module.exports = { startLogging, LOG_FILE };
