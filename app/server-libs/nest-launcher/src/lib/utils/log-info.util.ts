import { Logger } from '@nestjs/common';

import { SWAGGER_PATH } from '../config/info.config.js';

import type { MonolithOptions } from '../types/monolith.type.js';
import type { EnvType } from '../types/shared.types.js';
import type { MonolithEnvVariablesResponse } from '../types/utils.type.js';

const SECRET_PATTERN = /SECRET|PASSWORD|TOKEN|KEY|URL|DSN/i;

function maskValue(variable: string, value: string | undefined): string {
  if (!value) {
    return '(not set)';
  }

  if (SECRET_PATTERN.test(variable)) {
    return '***';
  }

  return value;
}

function logProjectEnvVariables(
  envVariables: EnvType[] | undefined,
  logger: Logger,
): void {
  if (!envVariables || envVariables.length === 0) {
    return;
  }

  logger.log('Project ENV variables:');

  for (const env of envVariables) {
    if (!env.isDisplayed) {
      continue;
    }

    const value = process.env[env.variable];
    const masked = maskValue(env.variable, value);

    if (env.required && !value) {
      logger.warn(
        `  ${env.name} (${env.variable}) = ${masked} [REQUIRED, MISSING]`,
      );
    } else {
      logger.log(`  ${env.name} (${env.variable}) = ${masked}`);
    }
  }

  logger.log('');
}

export function logMonolithMessages<T>(
  options: MonolithOptions<T>,
  env: MonolithEnvVariablesResponse,
  logger: Logger,
): void {
  const APP_NAME = options.name.toUpperCase();
  const APP_SCOPE = options.scope.toUpperCase();

  const { IS_DEV, APP_PORT, WINDOW_MS, REQUEST_LIMIT, CORS_ORIGINS } = env;

  logger.log(`${APP_NAME} API started successfully`);
  logger.log('');

  if (!IS_DEV) {
    return;
  }

  logger.log(`DEV mode: enabled`);
  logger.log(`Global scope: ${APP_SCOPE}`);
  logger.log(
    `To disable DEV mode, remove or set 'false' variable ${APP_SCOPE}_DEV_MODE`,
  );
  logger.log('');

  logger.log(`Application URL: http://localhost:${APP_PORT}`);
  logger.log(
    `Application global prefix: ${options.prefix ? 'api' : 'disabled'}`,
  );
  logger.log(`CORS Origins: ${CORS_ORIGINS.join(', ')}`);
  logger.log(
    `Swagger documentation: ${
      options.swagger
        ? `enabled. Path: http://localhost:${APP_PORT}/${SWAGGER_PATH}`
        : 'disabled'
    }`,
  );
  logger.log('');

  logger.log(`Logging status: ${options.logs ? 'enabled' : 'disabled'}`);
  logger.log(
    `Validation status: ${options.validation ? 'enabled' : 'disabled'}`,
  );
  logger.log(
    `Interceptors status: ${options.responseMap ? 'enabled' : 'disabled'}`,
  );
  logger.log(`Filters status: ${options.errorMap ? 'enabled' : 'disabled'}`);
  logger.log('');
  logger.log(
    `Compression status: ${options.compression ? 'enabled' : 'disabled'}`,
  );
  logger.log(
    `Cookie parser status: ${options.cookie ? 'enabled' : 'disabled'}`,
  );
  logger.log(
    `Rate limit status: ${options.rateLimit ? 'enabled' : 'disabled'}`,
  );
  if (options.rateLimit) {
    logger.log(`  Window: ${WINDOW_MS} minutes`);
    logger.log(`  Limit: ${REQUEST_LIMIT}`);
  }
  logger.log('');

  logProjectEnvVariables(options.envVariables, logger);

  logger.log('To configure Bootstrap, use next variables:');
  logger.log(`  ${APP_SCOPE}_DEV_MODE - DEV mode. Accepts "true" or "false"`);
  logger.log(`  ${APP_SCOPE}_${APP_NAME}_HTTP_PORT - HTTP Port. Default: 3000`);
  logger.log(
    `  ${APP_SCOPE}_${APP_NAME}_WINDOW_MS_MINUTES - Rate limit window in minutes. Default: 15`,
  );
  logger.log(
    `  ${APP_SCOPE}_${APP_NAME}_REQUEST_LIMIT - Rate limit requests per window. Default: 1000`,
  );
  logger.log(
    `  ${APP_SCOPE}_${APP_NAME}_CORS_ORIGINS - CORS allowed origins (comma-separated). Default: example.com,test.com`,
  );
  logger.log('');
}
