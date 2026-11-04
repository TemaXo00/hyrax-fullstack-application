import { applyDecorators, Put } from '@nestjs/common';
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

export const PUTMethod = (options: IMethodOptions): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiOkResponse({ description: 'Ресурс успешно обновлён' }),
    ApiBadRequestResponse({
      description: 'Запрос содержит некорректные данные',
    }),
    ApiInternalServerErrorResponse({
      description: 'Внутренняя ошибка сервера',
    }),
    Put(options.path),
  );
};

export const PUTProtectedMethod = (
  options: IProtectedMethodOptions,
): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiBearerAuth(),
    ApiOkResponse({ description: 'Ресурс успешно обновлён' }),
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
    Put(options.path),
    Validate(...(options.roles ?? [])),
  );
};
