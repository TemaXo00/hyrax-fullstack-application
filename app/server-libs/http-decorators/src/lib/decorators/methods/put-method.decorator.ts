import { applyDecorators, Put } from '@nestjs/common';
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

export const PUTMethod = (options: IMethodOptions): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiOkResponse(buildSuccessResponse(options, 'Ресурс успешно обновлён')),
    ...buildErrorResponses(options, 'PUT', PUBLIC_ERRORS),
    ...buildRequestBody(options),
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
    ApiOkResponse(buildSuccessResponse(options, 'Ресурс успешно обновлён')),
    ...buildErrorResponses(options, 'PUT', PROTECTED_ERRORS),
    ...buildRequestBody(options),
    Put(options.path),
    Validate(...(options.roles ?? [])),
  );
};
