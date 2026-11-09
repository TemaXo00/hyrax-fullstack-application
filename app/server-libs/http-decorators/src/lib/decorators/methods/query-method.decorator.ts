import { applyDecorators, QueryMethod } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import {
  PUBLIC_ERRORS,
  PROTECTED_ERRORS,
  buildErrorResponses,
  buildRequestBody,
  buildSuccessResponse,
} from '../swagger.util';
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
    ApiOkResponse(buildSuccessResponse(options, 'Запрос успешно обработан')),
    ...buildErrorResponses(options, 'GET', PUBLIC_ERRORS),
    ...buildRequestBody(options),
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
    ApiOkResponse(buildSuccessResponse(options, 'Запрос успешно обработан')),
    ...buildErrorResponses(options, 'GET', PROTECTED_ERRORS),
    ...buildRequestBody(options),
    QueryMethod(options.path),
    Validate(...(options.roles ?? [])),
  );
};
