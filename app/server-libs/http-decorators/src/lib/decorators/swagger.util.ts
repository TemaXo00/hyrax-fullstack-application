import { ApiBody } from '@nestjs/swagger';

import type { IMethodOptions } from './method-options.type.js';
import type { ApiResponseOptions } from '@nestjs/swagger';

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
