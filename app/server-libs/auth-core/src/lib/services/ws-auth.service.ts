import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthSessionValidatorService } from './session-validator.service';

import type { AuthJwtPayload, AuthenticatedUser } from '@org/types';

@Injectable()
export class AuthWsService {
  constructor(
    private readonly jwt: JwtService,
    private readonly validator: AuthSessionValidatorService,
  ) {}

  async authenticate(token?: string): Promise<AuthenticatedUser> {
    if (!token) {
      throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    let payload: AuthJwtPayload;

    try {
      payload = await this.jwt.verifyAsync<AuthJwtPayload>(token);
    } catch (error) {
      const expired =
        error instanceof Error && error.name === 'TokenExpiredError';

      throw new UnauthorizedException(
        expired ? AUTH_MESSAGES.TOKEN_EXPIRED : AUTH_MESSAGES.INVALID_TOKEN,
      );
    }

    if (!payload.id || !payload.sessionId) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
    }

    return await this.validator.validate(payload);
  }
}
