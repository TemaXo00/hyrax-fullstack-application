const { join } = require('node:path');

const base = require('./jest.config.cjs');

module.exports = {
  ...base,
  roots: [join(__dirname, 'services/server/e2e')],
  testMatch: ['**/*.e2e-spec.ts'],
  testTimeout: 30_000,
};
