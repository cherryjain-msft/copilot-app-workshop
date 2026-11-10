"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { BookingError, listServices, getSlots } = require("./slots");
const { createBookingStore } = require("./bookings");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png" };

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 10_000) reject(new BookingError("Request body too large", 413));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new BookingError("Body must be valid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res, pathname) {
  const rel = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) return sendJson(res, 403, { error: "Forbidden" });
  fs.readFile(file, (err, content) => {
    if (err) return sendJson(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(content);
  });
}

function createServer(store = createBookingStore()) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (req.method === "GET" && url.pathname === "/api/services") {
        return sendJson(res, 200, listServices(url.searchParams.get("vehicleType")));
      }
      if (req.method === "GET" && url.pathname === "/api/slots") {
        const date = url.searchParams.get("date");
        const vehicleType = url.searchParams.get("vehicleType");
        return sendJson(res, 200, getSlots(date, vehicleType, store.all()));
      }
      if (req.method === "POST" && url.pathname === "/api/bookings") {
        const booking = store.create(await readBody(req));
        return sendJson(res, 201, booking);
      }
      if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
        return serveStatic(req, res, url.pathname);
      }
      return sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      if (err instanceof BookingError) return sendJson(res, err.status, { error: err.message });
      console.error(err);
      return sendJson(res, 500, { error: "Internal server error" });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => {
    console.log(`Dealer Service Booking running at http://localhost:${port}`);
  });
}

module.exports = { createServer };
