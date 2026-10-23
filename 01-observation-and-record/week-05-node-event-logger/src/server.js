const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const SERVER_FILE = path.join(__dirname, "logger.js");
let lastMtime = fs.statSync(SERVER_FILE).mtimeMs;

setInterval(() => {
  try {
    const mtime = fs.statSync(SERVER_FILE).mtimeMs;
    if (mtime !== lastMtime) {
      console.log("logger.js changed — restarting...");
      process.exit(1);
    }
  } catch (e) {}
}, 1000);

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("404 Not Found"); return; }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

let isLogging = false;

function handleRequest(req, res) {
  if (req.method === "GET" && req.url === "/") {
    serveStatic(res, path.join(__dirname, "public", "index.html"), "text/html");
    return;
  }
  if (req.method === "GET" && req.url === "/style.css") {
    serveStatic(res, path.join(__dirname, "public", "style.css"), "text/css");
    return;
  }
  if (req.method === "POST" && req.url === "/start") {
    if (isLogging) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "already running" }));
      return;
    }
    try {
      delete require.cache[require.resolve("./logger")];
      const { startLogging, LOG_FILE } = require("./logger");
      if (typeof startLogging !== "function") {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: "startLogging is not implemented yet." }));
        return;
      }
      const logDir = path.join(__dirname, "logs");
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
      fs.writeFileSync(LOG_FILE, "");
      isLogging = true;
      const emitter = startLogging();
      emitter.on("done", () => { isLogging = false; });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "started" }));
    } catch (err) {
      isLogging = false;
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: err.message }));
    }
    return;
  }
  if (req.method === "POST" && req.url === "/reset") {
    isLogging = false;
    try {
      delete require.cache[require.resolve("./logger")];
      const { LOG_FILE } = require("./logger");
      if (fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "");
    } catch (e) {}
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "reset" }));
    return;
  }
  if (req.method === "GET" && req.url === "/logs") {
    try {
      delete require.cache[require.resolve("./logger")];
      const { LOG_FILE } = require("./logger");
      const content = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, "utf8") : "";
      const lines = content.trim().split("\n").filter(Boolean);
      const fileSize = fs.existsSync(LOG_FILE) ? fs.statSync(LOG_FILE).size : 0;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ lines, isLogging, fileSize }));
    } catch (err) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ lines: [], isLogging: false, fileSize: 0 }));
    }
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
