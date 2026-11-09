import { applyDecorators, Delete } from '@nestjs/common';
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

export const DELETEMethod = (options: IMethodOptions): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiOkResponse(buildSuccessResponse(options, 'Ресурс успешно удалён')),
    ...buildErrorResponses(options, 'DELETE', PUBLIC_ERRORS),
    ...buildRequestBody(options),
    Delete(options.path),
  );
};

export const DELETEProtectedMethod = (
  options: IProtectedMethodOptions,
): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiBearerAuth(),
    ApiOkResponse(buildSuccessResponse(options, 'Ресурс успешно удалён')),
    ...buildErrorResponses(options, 'DELETE', PROTECTED_ERRORS),
    ...buildRequestBody(options),
    Delete(options.path),
    Validate(...(options.roles ?? [])),
  );
};
