"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("../src/server");

let server;
let base;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test("GET /api/services returns services for a vehicle type", async () => {
  const res = await fetch(`${base}/api/services?vehicleType=EV`);
  assert.equal(res.status, 200);
  const services = await res.json();
  assert.ok(services.some((s) => s.id === "software-update"));
});

test("GET /api/slots returns slots", async () => {
  const res = await fetch(`${base}/api/slots?date=2026-11-16&vehicleType=Gas`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.open, true);
  assert.equal(body.slots.length, 9);
});

test("GET /api/slots includes charger fields only for EVs", async () => {
  const evRes = await fetch(`${base}/api/slots?date=2026-11-18&vehicleType=EV`);
  const evSlot = (await evRes.json()).slots[0];
  assert.equal(typeof evSlot.evChargingAvailable, "boolean");
  assert.equal(typeof evSlot.evChargingRemaining, "number");

  const gasRes = await fetch(`${base}/api/slots?date=2026-11-18&vehicleType=Gas`);
  const gasSlot = (await gasRes.json()).slots[0];
  assert.equal("evChargingAvailable" in gasSlot, false);
  assert.equal("evChargingRemaining" in gasSlot, false);
});

test("GET /api/slots returns 400 for bad input", async () => {
  const res = await fetch(`${base}/api/slots?date=bad&vehicleType=Gas`);
  assert.equal(res.status, 400);
});

test("POST /api/bookings creates a booking", async () => {
  const res = await fetch(`${base}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: "2026-11-16", time: "11:00", service: "brake-inspection", vehicleType: "Gas", customerName: "Jordan" }),
  });
  assert.equal(res.status, 201);
  const booking = await res.json();
  assert.equal(booking.customerName, "Jordan");
});

test("POST /api/bookings reserves charging bays and rejects a third reservation", async () => {
  const payload = {
    date: "2026-11-18",
    time: "10:00",
    service: "tire-rotation",
    vehicleType: "EV",
    evCharging: true,
  };
  for (const customerName of ["EV Customer 1", "EV Customer 2"]) {
    const res = await fetch(`${base}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, customerName }),
    });
    assert.equal(res.status, 201);
    assert.equal((await res.json()).evCharging, true);
  }
  const full = await fetch(`${base}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, customerName: "EV Customer 3" }),
  });
  assert.equal(full.status, 409);
  assert.match((await full.json()).error, /No EV charging bays left/);
});

test("POST /api/bookings rejects charging reservations for Gas vehicles", async () => {
  const res = await fetch(`${base}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2026-11-18",
      time: "10:00",
      service: "tire-rotation",
      vehicleType: "Gas",
      customerName: "Gas Customer",
      evCharging: true,
    }),
  });
  assert.equal(res.status, 400);
});

test("GET / serves the booking page", async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Dealer Service Booking/);
});
