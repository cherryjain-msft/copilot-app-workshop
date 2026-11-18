'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { canCancelOnline } = require('./booking-policy');

test('a booked appointment at the old 24-hour boundary can be canceled', () => {
  assert.equal(canCancelOnline({ status: 'booked', hoursUntil: 24 }), true);
});

test('a booked appointment inside the old 24-hour window cannot be canceled', () => {
  assert.equal(canCancelOnline({ status: 'booked', hoursUntil: 23 }), false);
});

test('a checked-in appointment cannot be canceled', () => {
  assert.equal(canCancelOnline({ status: 'checked_in', hoursUntil: 48 }), false);
});

test('a canceled appointment cannot be canceled again', () => {
  assert.equal(canCancelOnline({ status: 'canceled', hoursUntil: 48 }), false);
});

test('a past appointment cannot be canceled', () => {
  assert.equal(canCancelOnline({ status: 'booked', hoursUntil: -1 }), false);
});

test('a string is not a numeric time value', () => {
  assert.equal(canCancelOnline({ status: 'booked', hoursUntil: '48' }), false);
});
