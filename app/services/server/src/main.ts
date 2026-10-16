import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'HYRAX API',
      colors: true,
      compact: true,
      timestamp: false,
    }),
  });

  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);
  const port = config.get<number>('HYRAX_SERVER_PORT', 3000);
  const corsOrigins = config
    .get<string>('CORS_ORIGINS', 'localhost')
    .split(',');

  app.enableCors({
    allowedOrigins: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'QUERY', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: [
      'Authorization',
      'Set-Cookie',
      'Access-Control-Allow-Credentials',
    ],
    maxAge: 86400,
  });

  await app.listen(port);
}

void bootstrap();
