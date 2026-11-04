import type { UserRole } from '@org/types';

export interface IMethodOptions {
  path: string;
  summary: string;
  operationDesc: string;
}

export interface IProtectedMethodOptions extends IMethodOptions {
  roles?: UserRole[];
}
