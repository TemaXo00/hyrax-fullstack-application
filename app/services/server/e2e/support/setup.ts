import { ApiClient } from './api-client';
import { startE2eApplication } from './app';
import { createCacheClient } from './cache';
import { resetDatabase } from './database';

import type { E2eApplication } from './app';
import type { DatabaseService } from '@org/database';
import type Redis from 'ioredis';

export interface E2eContext {
  app: E2eApplication;
  db: DatabaseService;
  cache: Redis;
  client(ip?: string): ApiClient;
}

let ipCounter = 0;

export function nextClientIp(): string {
  ipCounter += 1;

  return `10.20.${Math.floor(ipCounter / 200)}.${(ipCounter % 200) + 1}`;
}

export function setupE2e(): () => E2eContext {
  let context: E2eContext;

  beforeAll(async () => {
    const app = await startE2eApplication();
    const cache = createCacheClient();

    context = {
      app,
      db: app.db,
      cache,
      client: (ip: string = nextClientIp()): ApiClient =>
        new ApiClient(app.baseUrl, ip),
    };
  });

  beforeEach(async () => {
    await resetDatabase(context.db);
    await context.cache.flushdb();
  });

  afterAll(async () => {
    await context.cache.quit();
    await context.app.close();
  });

  return () => context;
}
