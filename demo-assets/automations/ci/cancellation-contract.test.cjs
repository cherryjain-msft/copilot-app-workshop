'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const contract = require('./cancellation-contract.json');

test('portal cancellation fields are supplied by the API', () => {
  const missing = contract.portal.requiredFields.filter(
    field => !contract.api.responseFields.includes(field)
  );
  assert.deepEqual(
    missing,
    [],
    `Portal expects fields absent from the API: ${missing.join(', ')}`
  );
});
