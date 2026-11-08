const { join } = require('node:path');

const rootDir = __dirname;

module.exports = {
  rootDir,
  testEnvironment: 'node',
  roots: [
    join(rootDir, 'server-libs'),
    join(rootDir, 'core-libs'),
    join(rootDir, 'services/server'),
  ],
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  setupFiles: ['reflect-metadata'],
  clearMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: join(rootDir, 'tsconfig.spec.json'),
      },
    ],
  },
  moduleNameMapper: {
    '^@org/types$': join(rootDir, 'core-libs/types/src/index.ts'),
    '^@org/validation-config$': join(
      rootDir,
      'core-libs/validation-config/src/index.ts',
    ),
    '^@org/validation-messages$': join(
      rootDir,
      'core-libs/validation-messages/src/index.ts',
    ),
    '^@org/database$': join(rootDir, 'server-libs/database/src/index.ts'),
    '^@org/redis$': join(rootDir, 'server-libs/redis/src/index.ts'),
    '^@org/auth-core$': join(rootDir, 'server-libs/auth-core/src/index.ts'),
    '^@org/auth-feature$': join(
      rootDir,
      'server-libs/auth-feature/src/index.ts',
    ),
    '^@org/auth-session-feature$': join(
      rootDir,
      'server-libs/auth-session-feature/src/index.ts',
    ),
    '^@org/auth-admin-feature$': join(
      rootDir,
      'server-libs/auth-admin-feature/src/index.ts',
    ),
    '^@org/http-decorators$': join(
      rootDir,
      'server-libs/http-decorators/src/index.ts',
    ),
    '^@org/dto$': join(rootDir, 'server-libs/dto/src/index.ts'),
    '^@org/nest-launcher$': join(
      rootDir,
      'server-libs/nest-launcher/src/index.ts',
    ),
    '^@org/pet-feature$': join(rootDir, 'server-libs/pet-feature/src/index.ts'),
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
