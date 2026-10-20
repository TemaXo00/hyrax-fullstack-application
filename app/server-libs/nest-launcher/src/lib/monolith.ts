import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { AllExceptionsFilter } from './common/exception.filter.js';
import { loggingMiddleware } from './common/logging.middleware.js';
import { ResponseInterceptor } from './common/response.interceptor.js';
import { CONSOLE_LOGGER_CONFIG } from './config/console-logger.config.js';
import { CORS_CONFIG } from './config/cors.config.js';
import { SWAGGER_PATH } from './config/info.config.js';
import { RATE_LIMIT_CONFIG } from './config/rate-limit.config.js';
import { SWAGGER_CONFIG, SWAGGER_UI_CONFIG } from './config/swagger.config.js';
import { VALIDATION_CONFIG } from './config/validation.config.js';
import { setupMonolithEnvVariables } from './utils/env-variables.util.js';
import { logMonolithMessages } from './utils/log-info.util.js';

import type { MonolithOptions } from './types/monolith.type.js';

export async function monolith<T>(options: MonolithOptions<T>): Promise<void> {
  const app = await NestFactory.create(options.module, {
    logger: options.logs
      ? new ConsoleLogger(CONSOLE_LOGGER_CONFIG(options.name.toUpperCase()))
      : ['error', 'warn'],
  });

  const logger = new Logger();
  const config = app.get(ConfigService);

  const APP_NAME = options.name.toUpperCase();
  const APP_PREFIX = 'api';
  const APP_SCOPE = options.scope.toUpperCase();

  const { APP_PORT, REQUEST_LIMIT, IS_DEV, CORS_ORIGINS, WINDOW_MS } =
    setupMonolithEnvVariables(APP_SCOPE, APP_NAME, config);

  if (options.prefix) {
    app.setGlobalPrefix(APP_PREFIX);
  }

  if (options.logs) {
    app.use(loggingMiddleware);
  }

  if (options.responseMap) {
    app.useGlobalInterceptors(new ResponseInterceptor());
  }

  if (options.errorMap) {
    app.useGlobalFilters(new AllExceptionsFilter());
  }

  if (options.validation) {
    app.useGlobalPipes(new ValidationPipe(VALIDATION_CONFIG));
  }

  if (options.cors) {
    app.enableCors(CORS_CONFIG(CORS_ORIGINS));
  }

  if (options.cookie) {
    app.use(cookieParser());
  }

  if (options.swagger) {
    const swaggerDocument: OpenAPIObject = SwaggerModule.createDocument(
      app,
      SWAGGER_CONFIG,
    );
    SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument, SWAGGER_UI_CONFIG);
  }

  if (options.rateLimit) {
    app.use(rateLimit(RATE_LIMIT_CONFIG(WINDOW_MS, REQUEST_LIMIT)));
  }

  if (options.compression) {
    app.use(compression());
  }

  logMonolithMessages(
    options,
    { APP_PORT, REQUEST_LIMIT, IS_DEV, CORS_ORIGINS, WINDOW_MS },
    logger,
  );

  process.on('SIGTERM', async () => {
    logger.log('Received SIGTERM, shutting down...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('Received SIGINT, shutting down...');
    await app.close();
    process.exit(0);
  });

  try {
    await app.listen(APP_PORT);
    logger.log(`${APP_NAME} started successfully`);
  } catch (error) {
    logger.error('Failed to start');
    logger.error(error);
    process.exit(1);
  }
}
