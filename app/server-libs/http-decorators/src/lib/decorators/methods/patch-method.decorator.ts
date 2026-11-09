import { applyDecorators, Patch } from '@nestjs/common';
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

export const PATCHMethod = (options: IMethodOptions): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiOkResponse(buildSuccessResponse(options, 'Ресурс успешно обновлён')),
    ...buildErrorResponses(options, 'PATCH', PUBLIC_ERRORS),
    ...buildRequestBody(options),
    Patch(options.path),
  );
};

export const PATCHProtectedMethod = (
  options: IProtectedMethodOptions,
): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiBearerAuth(),
    ApiOkResponse(buildSuccessResponse(options, 'Ресурс успешно обновлён')),
    ...buildErrorResponses(options, 'PATCH', PROTECTED_ERRORS),
    ...buildRequestBody(options),
    Patch(options.path),
    Validate(...(options.roles ?? [])),
  );
};
