#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = dirname(dirname(dirname(scriptDirectory)));
const repositoryDirectory = dirname(appDirectory);

const DB_PORT = process.env.HYRAX_E2E_DB_PORT ?? '55432';
const DB_NAME = process.env.HYRAX_E2E_DB_NAME ?? 'hyrax_e2e';
const DB_USER = process.env.HYRAX_E2E_DB_USER ?? 'hyrax';
const DB_PASSWORD = process.env.HYRAX_E2E_DB_PASSWORD ?? 'hyrax_e2e_password';
const REDIS_PORT = process.env.HYRAX_E2E_REDIS_PORT ?? '56379';
const REDIS_PASSWORD =
  process.env.HYRAX_E2E_REDIS_PASSWORD ?? 'hyrax_e2e_password';

const useDocker = process.env.HYRAX_E2E_SKIP_DOCKER !== '1';
const keepContainers = process.env.HYRAX_E2E_KEEP === '1';
const skipMigrations = process.env.HYRAX_E2E_SKIP_MIGRATE === '1';

const databaseUrl =
  process.env.HYRAX_DB_URL ??
  `postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}?schema=public`;
const redisUrl =
  process.env.HYRAX_REDIS_URL ?? `redis://127.0.0.1:${REDIS_PORT}`;

const environment = {
  ...process.env,
  HYRAX_DEV_MODE: 'true',
  HYRAX_DB_URL: databaseUrl,
  HYRAX_REDIS_URL: redisUrl,
  HYRAX_REDIS_PASSWORD: process.env.HYRAX_REDIS_PASSWORD ?? REDIS_PASSWORD,
  HYRAX_REDIS_CACHE_TTL_SECONDS:
    process.env.HYRAX_REDIS_CACHE_TTL_SECONDS ?? '60',
  HYRAX_JWT_SECRET:
    process.env.HYRAX_JWT_SECRET ?? 'hyrax-e2e-access-token-secret',
  HYRAX_JWT_ACCESS_TOKEN_TTL_MINUTES:
    process.env.HYRAX_JWT_ACCESS_TOKEN_TTL_MINUTES ?? '15',
  HYRAX_JWT_REFRESH_TOKEN_TTL_DAYS:
    process.env.HYRAX_JWT_REFRESH_TOKEN_TTL_DAYS ?? '30',
  HYRAX_SERVER_CORS_ORIGINS:
    process.env.HYRAX_SERVER_CORS_ORIGINS ?? 'http://localhost:5173',
  HYRAX_SERVER_WINDOW_MS_MINUTES:
    process.env.HYRAX_SERVER_WINDOW_MS_MINUTES ?? '15',
  HYRAX_SERVER_REQUEST_LIMIT:
    process.env.HYRAX_SERVER_REQUEST_LIMIT ?? '100000',
  HYRAX_E2E_DB_PORT: DB_PORT,
  HYRAX_E2E_DB_NAME: DB_NAME,
  HYRAX_E2E_DB_USER: DB_USER,
  HYRAX_E2E_DB_PASSWORD: DB_PASSWORD,
  HYRAX_E2E_REDIS_PORT: REDIS_PORT,
  HYRAX_E2E_REDIS_PASSWORD: REDIS_PASSWORD,
};

const composeFile = join(repositoryDirectory, 'docker-compose.e2e.yml');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: appDirectory,
    env: environment,
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const error = new Error(
      `Команда "${command} ${args.join(' ')}" завершилась с кодом ${result.status}`,
    );

    error.exitCode = result.status ?? 1;

    throw error;
  }
}

function upInfrastructure() {
  run('docker', ['compose', '-f', composeFile, 'up', '-d', '--wait']);
}

function downInfrastructure() {
  if (!useDocker || keepContainers) {
    return;
  }

  run('docker', [
    'compose',
    '-f',
    composeFile,
    'down',
    '-v',
    '--remove-orphans',
  ]);
}

function migrateDatabase() {
  if (skipMigrations) {
    return;
  }

  run('npx', [
    'prisma',
    'migrate',
    'deploy',
    '--config',
    'server-libs/database/prisma7.config.ts',
  ]);
}

function runE2eTests() {
  run(process.execPath, [
    '--experimental-vm-modules',
    'node_modules/jest/bin/jest.js',
    '--config',
    'jest.e2e.config.cjs',
    '--runInBand',
    ...process.argv.slice(2),
  ]);
}

let exitCode = 0;

try {
  if (useDocker) {
    upInfrastructure();
  }

  migrateDatabase();
  runE2eTests();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  exitCode = error instanceof Error ? (error.exitCode ?? 1) : 1;
} finally {
  try {
    downInfrastructure();
  } catch (error) {
    console.error(
      `Не удалось остановить инфраструктуру: ${
        error instanceof Error ? error.message : error
      }`,
    );

    if (exitCode === 0) {
      exitCode = 1;
    }
  }
}

process.exit(exitCode);
