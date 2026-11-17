import { NestFactory } from '@nestjs/core';
import { DatabaseService } from '@org/database';
import { configureMonolith } from '@org/nest-launcher';

import { AppModule } from '../../src/app.module';

import type { INestApplication } from '@nestjs/common';

export interface E2eApplication {
  app: INestApplication;
  db: DatabaseService;
  baseUrl: string;
  close(): Promise<void>;
}

export async function startE2eApplication(): Promise<E2eApplication> {
  if (!process.env.HYRAX_DB_URL) {
    throw new Error(
      'Не задана переменная HYRAX_DB_URL. Запускайте e2e через npm run test:e2e',
    );
  }

  const app = await NestFactory.create(AppModule, { logger: false });

  configureMonolith(app, {
    name: 'Server',
    scope: 'Hyrax',
    module: AppModule,
    logs: false,
    prefix: true,
    validation: true,
    responseMap: true,
    errorMap: true,
    compression: true,
    swagger: true,
    cookie: true,
    cors: false,
  });

  app.getHttpAdapter().getInstance().set('trust proxy', true);

  await app.listen(0, '127.0.0.1');

  const db = app.get(DatabaseService);
  const baseUrl = await app.getUrl();

  return {
    app,
    db,
    baseUrl,
    async close(): Promise<void> {
      await app.close();
      await db.$disconnect();
    },
  };
}
