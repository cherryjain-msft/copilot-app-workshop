"use strict";

const SERVICES = {
  "oil-change": { name: "Oil change", durationMin: 45, vehicleTypes: ["Gas", "Hybrid"] },
  "tire-rotation": { name: "Tire rotation", durationMin: 30, vehicleTypes: ["Gas", "Hybrid", "EV"] },
  "brake-inspection": { name: "Brake inspection", durationMin: 60, vehicleTypes: ["Gas", "Hybrid", "EV"] },
  "software-update": { name: "Software update", durationMin: 40, vehicleTypes: ["Hybrid", "EV"] },
};

const VEHICLE_TYPES = ["Gas", "Hybrid", "EV"];

const OPEN_HOUR = 8;
const CLOSE_HOUR = 17;
const SERVICE_BAYS_PER_HOUR = 4;

function isValidDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

function isSunday(date) {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

function validateVehicleType(vehicleType) {
  if (!VEHICLE_TYPES.includes(vehicleType)) {
    throw new BookingError(`vehicleType must be one of: ${VEHICLE_TYPES.join(", ")}`);
  }
}

class BookingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "BookingError";
    this.status = status;
  }
}

function listServices(vehicleType) {
  validateVehicleType(vehicleType);
  return Object.entries(SERVICES)
    .filter(([, s]) => s.vehicleTypes.includes(vehicleType))
    .map(([id, s]) => ({ id, name: s.name, durationMin: s.durationMin }));
}

function hourLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Returns hourly slots for a date with remaining service-bay capacity.
 * @param {string} date YYYY-MM-DD
 * @param {string} vehicleType Gas | Hybrid | EV
 * @param {Array<{date:string,time:string}>} bookings existing bookings
 */
function getSlots(date, vehicleType, bookings = []) {
  if (!isValidDate(date)) throw new BookingError("date must be YYYY-MM-DD");
  validateVehicleType(vehicleType);

  if (isSunday(date)) {
    return { date, vehicleType, open: false, slots: [] };
  }

  const slots = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const time = hourLabel(hour);
    const booked = bookings.filter((b) => b.date === date && b.time === time).length;
    const remaining = Math.max(0, SERVICE_BAYS_PER_HOUR - booked);
    slots.push({ time, available: remaining > 0, remaining });
  }
  return { date, vehicleType, open: true, slots };
}

module.exports = {
  SERVICES,
  VEHICLE_TYPES,
  OPEN_HOUR,
  CLOSE_HOUR,
  SERVICE_BAYS_PER_HOUR,
  BookingError,
  isValidDate,
  listServices,
  getSlots,
};
