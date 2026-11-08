import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthSessionValidatorService } from '../services/session-validator.service';

import type { AuthJwtPayload, AuthenticatedUser } from '@org/types';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: AuthJwtPayload | AuthenticatedUser;
};

@Injectable()
export class AuthJwtGuard extends AuthGuard('jwt') {
  constructor(private readonly validator: AuthSessionValidatorService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const payload = request.user;

    if (!payload || !('sessionId' in payload)) {
      throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    request.user = await this.validator.validate(payload);

    return true;
  }
}
