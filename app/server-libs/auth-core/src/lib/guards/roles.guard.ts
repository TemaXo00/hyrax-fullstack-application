import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_ROLES_KEY } from '@org/types';
import { AUTH_MESSAGES } from '@org/validation-messages';

import type { AuthenticatedUser, UserRole } from '@org/types';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(
      AUTH_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED);
    }

    return true;
  }
}
