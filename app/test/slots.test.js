"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  SERVICE_BAYS_PER_HOUR,
  BookingError,
  isValidDate,
  listServices,
  getSlots,
} = require("../src/slots");
const { createBookingStore } = require("../src/bookings");

const MONDAY = "2026-11-16";
const SUNDAY = "2026-11-15";

test("isValidDate accepts real dates and rejects bad input", () => {
  assert.equal(isValidDate(MONDAY), true);
  assert.equal(isValidDate("2026-02-30"), false);
  assert.equal(isValidDate("11/16/2026"), false);
  assert.equal(isValidDate(undefined), false);
});

test("listServices filters by vehicle type", () => {
  const ev = listServices("EV").map((s) => s.id);
  assert.ok(!ev.includes("oil-change"), "EVs do not get oil changes");
  assert.ok(ev.includes("software-update"));

  const gas = listServices("Gas").map((s) => s.id);
  assert.ok(gas.includes("oil-change"));
  assert.ok(!gas.includes("software-update"));
});

test("listServices rejects an unknown vehicle type", () => {
  assert.throws(() => listServices("Diesel"), BookingError);
});

test("getSlots returns hourly slots 08:00-16:00 with full capacity", () => {
  const { open, slots } = getSlots(MONDAY, "Gas");
  assert.equal(open, true);
  assert.equal(slots.length, 9);
  assert.equal(slots[0].time, "08:00");
  assert.equal(slots.at(-1).time, "16:00");
  assert.ok(slots.every((s) => s.available && s.remaining === SERVICE_BAYS_PER_HOUR));
});

test("getSlots is closed on Sundays", () => {
  assert.deepEqual(getSlots(SUNDAY, "EV"), { date: SUNDAY, vehicleType: "EV", open: false, slots: [] });
});

test("getSlots reduces capacity for existing bookings", () => {
  const bookings = [
    { date: MONDAY, time: "09:00" },
    { date: MONDAY, time: "09:00" },
    { date: "2026-11-17", time: "09:00" },
  ];
  const nine = getSlots(MONDAY, "Hybrid", bookings).slots.find((s) => s.time === "09:00");
  assert.equal(nine.remaining, SERVICE_BAYS_PER_HOUR - 2);
});

test("getSlots validates input", () => {
  assert.throws(() => getSlots("tomorrow", "Gas"), /YYYY-MM-DD/);
  assert.throws(() => getSlots(MONDAY, "Truck"), /vehicleType/);
});

test("booking store creates bookings and enforces capacity", () => {
  const store = createBookingStore();
  const base = { date: MONDAY, time: "10:00", service: "tire-rotation", vehicleType: "EV" };
  for (let i = 0; i < SERVICE_BAYS_PER_HOUR; i++) {
    const b = store.create({ ...base, customerName: `Customer ${i}` });
    assert.equal(b.id, i + 1);
  }
  assert.throws(() => store.create({ ...base, customerName: "One too many" }), /No bays left/);
});

test("booking store rejects services not offered for the vehicle type", () => {
  const store = createBookingStore();
  assert.throws(
    () => store.create({ date: MONDAY, time: "10:00", service: "oil-change", vehicleType: "EV", customerName: "Ana" }),
    /not available for EV/
  );
});

test("booking store requires a customer name", () => {
  const store = createBookingStore();
  assert.throws(
    () => store.create({ date: MONDAY, time: "10:00", service: "tire-rotation", vehicleType: "Gas", customerName: " " }),
    /customerName/
  );
});
