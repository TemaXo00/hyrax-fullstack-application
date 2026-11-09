import type { Type } from '@nestjs/common';
import type { UserRole } from '@org/types';

export const ERROR_STATUS_CODES = [400, 401, 403, 404, 409, 429, 500] as const;

export type ErrorStatusCode = (typeof ERROR_STATUS_CODES)[number];

export interface IErrorResponseOptions {
  status: ErrorStatusCode;
  description: string;
  message?: string;
}

export interface IMethodOptions {
  path: string;
  summary: string;
  operationDesc: string;
  requestDto?: Type<unknown>;
  requestDescription?: string;
  responseDto?: Type<unknown>;
  responseIsArray?: boolean;
  responseDescription?: string;
  errors?: IErrorResponseOptions[];
}

export interface IProtectedMethodOptions extends IMethodOptions {
  roles?: UserRole[];
}
