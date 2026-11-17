import { Redis } from 'ioredis';

export function createCacheClient(): Redis {
  const url = process.env.HYRAX_REDIS_URL;

  if (!url) {
    throw new Error(
      'Не задана переменная HYRAX_REDIS_URL. Запускайте e2e через npm run test:e2e',
    );
  }

  return new Redis(url, {
    password: process.env.HYRAX_REDIS_PASSWORD,
    maxRetriesPerRequest: 1,
  });
}
