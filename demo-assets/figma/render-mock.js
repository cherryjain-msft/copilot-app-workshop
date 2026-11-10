// Renders the "Booking – EV charging bay" design mock to PNG.
// Usage (from repo root, after `npm install` in deck/): node demo-assets/figma/render-mock.js
"use strict";

const path = require("path");
const sharp = require(path.join(__dirname, "..", "..", "deck", "node_modules", "sharp"));

const C = {
  navy: "#003478", blue: "#1F6FEB", ink: "#0F172A", body: "#334155", muted: "#64748B",
  border: "#E2E8F0", bg: "#F8FAFC", white: "#FFFFFF", green: "#15803D", greenBg: "#F0FDF4",
  greenBorder: "#86EFAC", blueBg: "#EFF6FF", amber: "#B45309",
};
const FONT = "Segoe UI, Arial, sans-serif";

const W = 1440, H = 832;
const cardX = 340, cardY = 128, cardW = 760;
const ix = cardX + 32, iw = cardW - 64, colW = (iw - 32) / 2;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const text = (x, y, s, size, color, weight = 400, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
const rect = (x, y, w, h, fill, stroke = "none", r = 6, sw = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

function field(x, y, label, value, dropdown = false) {
  let s = text(x, y, label, 14, C.ink, 600);
  s += rect(x, y + 10, colW, 44, C.white, C.border);
  s += text(x + 14, y + 38, value, 15, C.ink);
  if (dropdown) s += `<path d="M${x + colW - 26} ${y + 28} l6 6 l6 -6" fill="none" stroke="${C.muted}" stroke-width="2"/>`;
  return s;
}

const bolt = (x, y, color) =>
  `<path d="M${x + 6} ${y} L${x} ${y + 9} L${x + 4.5} ${y + 9} L${x + 3} ${y + 16} L${x + 10} ${y + 6} L${x + 5.5} ${y + 6} L${x + 7} ${y} Z" fill="${color}"/>`;

const slots = [
  ["08:00", 4, 2], ["09:00", 3, 1], ["10:00", 4, 2], ["11:00", 2, 0], ["12:00", 4, 2],
  ["13:00", 4, 1], ["14:00", 3, 2], ["15:00", 1, 0], ["16:00", 4, 2],
];
const selected = "10:00";

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
svg += rect(0, 0, W, H, C.bg, "none", 0);

// Header
svg += rect(0, 0, W, 88, C.navy, "none", 0);
svg += text(48, 46, "Dealer Service Booking", 26, C.white, 600);
svg += text(48, 70, "Book a service appointment at your local dealer", 14, "#CBD5E1");

// Card
svg += `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="664" rx="12" fill="${C.white}" stroke="${C.border}"/>`;
let y = cardY + 44;
svg += field(ix, y, "Your name", "Alex Rivera");
svg += field(ix + colW + 32, y, "Vehicle type", "EV", true);
y += 84;
svg += field(ix, y, "Service", "Software update · 40 min", true);
svg += field(ix + colW + 32, y, "Date", "11/18/2026");

// EV charging panel (new)
y += 84;
svg += rect(ix, y, iw, 96, C.greenBg, C.greenBorder, 8);
svg += `<circle cx="${ix + 36}" cy="${y + 48}" r="20" fill="${C.green}"/>` + bolt(ix + 31, y + 40, C.white);
svg += text(ix + 72, y + 40, "Reserve EV charging bay", 17, C.ink, 600);
svg += rect(ix + 282, y + 25, 64, 22, "#DCFCE7", "none", 11);
svg += text(ix + 314, y + 41, "EV only", 12, C.green, 600, "middle");
svg += text(ix + 72, y + 66, "Charge while we service your vehicle · free during your appointment", 14, C.body);
// toggle (on)
svg += rect(ix + iw - 76, y + 34, 52, 28, C.blue, "none", 14);
svg += `<circle cx="${ix + iw - 38}" cy="${y + 48}" r="11" fill="${C.white}"/>`;

// Slots
y += 128;
svg += text(ix, y, "Available times", 14, C.ink, 600);
svg += text(ix + iw, y, "2 charging bays per hour", 13, C.muted, 400, "end");
const cols = 5, gap = 12, sw = (iw - gap * (cols - 1)) / cols, sh = 84;
slots.forEach(([t, bays, chargers], i) => {
  const sx = ix + (i % cols) * (sw + gap);
  const sy = y + 14 + Math.floor(i / cols) * (sh + gap);
  const isSel = t === selected;
  svg += rect(sx, sy, sw, sh, isSel ? C.blueBg : C.white, isSel ? C.blue : C.border, 8, isSel ? 2 : 1);
  svg += text(sx + sw / 2, sy + 28, t, 17, C.ink, 600, "middle");
  svg += text(sx + sw / 2, sy + 48, `${bays} bay${bays === 1 ? "" : "s"} left`, 12, C.muted, 400, "middle");
  const full = chargers === 0;
  const label = full ? "No chargers" : `${chargers} charger${chargers > 1 ? "s" : ""}`;
  const col = full ? C.amber : C.green;
  const lw = label.length * 6.6 + 18;
  svg += bolt(sx + sw / 2 - lw / 2, sy + 58, col);
  svg += text(sx + sw / 2 - lw / 2 + 15, sy + 71, label, 12, col, 600);
});

// Button
y += 14 + 2 * sh + gap + 28;
svg += rect(ix, y, iw, 52, C.blue, "none", 8);
svg += text(ix + iw / 2, y + 33, "Book appointment + charging bay", 16, C.white, 600, "middle");
svg += text(ix + iw / 2, y + 80, "Selected: Wed 11/18 at 10:00 · Software update · EV charging bay", 13, C.muted, 400, "middle");

// Frame label (as Figma shows it)
svg += text(cardX + cardW + 40, cardY + 20, "Booking – EV charging bay", 13, C.muted, 600);
svg += text(cardX + cardW + 40, cardY + 40, "Design for FORD-101", 12, C.muted);
svg += `</svg>`;

const out = path.join(__dirname, "booking-ev-slot.png");
sharp(Buffer.from(svg)).png().toFile(out).then(() => console.log(`Wrote ${out}`));
