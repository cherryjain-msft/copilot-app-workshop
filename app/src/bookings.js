"use strict";

const { SERVICES, BookingError, getSlots } = require("./slots");

function createBookingStore() {
  const bookings = [];
  let nextId = 1;

  return {
    all() {
      return bookings.slice();
    },

    create({ date, time, service, vehicleType, customerName }) {
      if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
        throw new BookingError("customerName is required");
      }
      const svc = SERVICES[service];
      if (!svc) throw new BookingError(`Unknown service: ${service}`);
      if (!svc.vehicleTypes.includes(vehicleType)) {
        throw new BookingError(`${svc.name} is not available for ${vehicleType} vehicles`);
      }

      const { open, slots } = getSlots(date, vehicleType, bookings);
      if (!open) throw new BookingError("The service center is closed on Sundays", 409);
      const slot = slots.find((s) => s.time === time);
      if (!slot) throw new BookingError(`Invalid time: ${time}`);
      if (!slot.available) throw new BookingError(`No bays left at ${time}`, 409);

      const booking = {
        id: nextId++,
        date,
        time,
        service,
        vehicleType,
        customerName: customerName.trim(),
      };
      bookings.push(booking);
      return booking;
    },
  };
}

module.exports = { createBookingStore };
