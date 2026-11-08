import type { Type } from '@nestjs/common';
import type { UserRole } from '@org/types';

export interface IMethodOptions {
  path: string;
  summary: string;
  operationDesc: string;
  requestDto?: Type<unknown>;
  requestDescription?: string;
  responseDto?: Type<unknown>;
  responseIsArray?: boolean;
  responseDescription?: string;
}

export interface IProtectedMethodOptions extends IMethodOptions {
  roles?: UserRole[];
}
