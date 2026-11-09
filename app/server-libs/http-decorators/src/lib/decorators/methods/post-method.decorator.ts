import { applyDecorators, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

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

export const POSTMethod = (options: IMethodOptions): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiCreatedResponse(buildSuccessResponse(options, 'Ресурс успешно создан')),
    ...buildErrorResponses(options, 'POST', PUBLIC_ERRORS),
    ...buildRequestBody(options),
    Post(options.path),
  );
};

export const POSTProtectedMethod = (
  options: IProtectedMethodOptions,
): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.operationDesc,
    }),
    ApiBearerAuth(),
    ApiCreatedResponse(buildSuccessResponse(options, 'Ресурс успешно создан')),
    ...buildErrorResponses(options, 'POST', PROTECTED_ERRORS),
    ...buildRequestBody(options),
    Post(options.path),
    Validate(...(options.roles ?? [])),
  );
};
