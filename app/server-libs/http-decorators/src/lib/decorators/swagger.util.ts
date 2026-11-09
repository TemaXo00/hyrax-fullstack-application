import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@org/dto';

import type {
  ErrorStatusCode,
  IErrorResponseOptions,
  IMethodOptions,
} from './method-options.type';
import type { ApiResponseOptions } from '@nestjs/swagger';

const ERROR_MESSAGES: Record<ErrorStatusCode, string> = {
  400: 'Запрос содержит некорректные данные',
  401: 'Требуется авторизация',
  403: 'Недостаточно прав для выполнения действия',
  404: 'Ресурс не найден',
  409: 'Ресурс уже существует',
  429: 'Превышен лимит запросов',
  500: 'Внутренняя ошибка сервера',
};

export const PUBLIC_ERRORS: IErrorResponseOptions[] = [
  { status: 400, description: ERROR_MESSAGES[400] },
  { status: 429, description: ERROR_MESSAGES[429] },
  { status: 500, description: ERROR_MESSAGES[500] },
];

export const PROTECTED_ERRORS: IErrorResponseOptions[] = [
  { status: 400, description: ERROR_MESSAGES[400] },
  { status: 401, description: ERROR_MESSAGES[401] },
  { status: 403, description: ERROR_MESSAGES[403] },
  { status: 429, description: ERROR_MESSAGES[429] },
  { status: 500, description: ERROR_MESSAGES[500] },
];

export function buildRequestBody(options: IMethodOptions): MethodDecorator[] {
  if (!options.requestDto) {
    return [];
  }

  return [
    ApiBody({
      type: options.requestDto,
      description: options.requestDescription,
    }),
  ];
}

export function buildSuccessResponse(
  options: IMethodOptions,
  fallbackDescription: string,
): ApiResponseOptions {
  return {
    description: options.responseDescription ?? fallbackDescription,
    ...(options.responseDto ? { type: options.responseDto } : {}),
    ...(options.responseIsArray ? { isArray: true } : {}),
  };
}

export function buildErrorResponses(
  options: IMethodOptions,
  method: string,
  defaults: IErrorResponseOptions[],
): MethodDecorator[] {
  const errors = new Map<ErrorStatusCode, IErrorResponseOptions>();

  for (const error of [...defaults, ...(options.errors ?? [])]) {
    errors.set(error.status, error);
  }

  return [...errors.values()].map((error) =>
    ApiResponse({
      status: error.status,
      type: ErrorResponseDto,
      description: error.description,
      example: {
        status: 'error',
        timestamp: new Date(0).toISOString(),
        path: options.path,
        method,
        message: error.message ?? ERROR_MESSAGES[error.status],
        duration: '12ms',
      },
    }),
  );
}
