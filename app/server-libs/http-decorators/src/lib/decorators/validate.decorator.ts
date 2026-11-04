import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthJwtGuard, RolesGuard } from '@org/auth-core';
import { AUTH_ROLES_KEY } from '@org/types';

import type { UserRole } from '@org/types';

export function Validate(...allowedRoles: UserRole[]): MethodDecorator {
  return applyDecorators(
    SetMetadata(AUTH_ROLES_KEY, allowedRoles),
    UseGuards(AuthJwtGuard, RolesGuard),
  );
}
