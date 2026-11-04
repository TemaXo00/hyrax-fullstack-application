import { applyDecorators, QueryMethod } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Validate } from '../validate.decorator';

import type {
  IMethodOptions,
  IProtectedMethodOptions,
} from '../method-options.type';

export const QUERYMethod = (options: IMethodOptions): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiOkResponse({ description: 'Запрос успешно обработан' }),
    ApiBadRequestResponse({
      description: 'Запрос содержит некорректные данные',
    }),
    ApiInternalServerErrorResponse({
      description: 'Внутренняя ошибка сервера',
    }),
    QueryMethod(options.path),
  );
};

export const QUERYProtectedMethod = (
  options: IProtectedMethodOptions,
): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiBearerAuth(),
    ApiOkResponse({ description: 'Запрос успешно обработан' }),
    ApiBadRequestResponse({
      description: 'Запрос содержит некорректные данные',
    }),
    ApiUnauthorizedResponse({ description: 'Требуется авторизация' }),
    ApiForbiddenResponse({
      description: 'Недостаточно прав для выполнения действия',
    }),
    ApiInternalServerErrorResponse({
      description: 'Внутренняя ошибка сервера',
    }),
    QueryMethod(options.path),
    Validate(...(options.roles ?? [])),
  );
};
