'use strict';

const CANCELLATION_CUTOFF_HOURS = 24;

function canCancelOnline({ status, hoursUntil }) {
  return status === 'booked'
    && Number.isFinite(hoursUntil)
    && hoursUntil >= CANCELLATION_CUTOFF_HOURS;
}

module.exports = { canCancelOnline };
