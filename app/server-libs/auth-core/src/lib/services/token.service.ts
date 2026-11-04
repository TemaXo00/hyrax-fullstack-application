import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { AUTH_CONFIG } from '@org/validation-config';
import { AUTH_MESSAGES } from '@org/validation-messages';
import * as argon2 from 'argon2';

import type { AuthJwtPayload, AuthTokens } from '@org/types';

@Injectable()
export class AuthTokenService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const accessMinutes = Number(
      this.config.get<string | number>(
        'HYRAX_JWT_ACCESS_TOKEN_TTL_MINUTES',
        AUTH_CONFIG.TOKEN.ACCESS_TTL_MINUTES,
      ),
    );
    const refreshDays = Number(
      this.config.get<string | number>(
        'HYRAX_JWT_REFRESH_TOKEN_TTL_DAYS',
        AUTH_CONFIG.TOKEN.REFRESH_TTL_DAYS,
      ),
    );

    this.accessTtlSeconds = accessMinutes * 60;
    this.refreshTtlSeconds = refreshDays * 24 * 60 * 60;
  }

  generateTokens(payload: AuthJwtPayload): AuthTokens {
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.accessTtlSeconds,
    });
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: this.refreshTtlSeconds,
    });

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): AuthJwtPayload {
    try {
      const payload = this.jwt.verify<AuthJwtPayload>(token);

      return {
        id: payload.id,
        sessionId: payload.sessionId,
        role: payload.role,
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_EXPIRED);
      }

      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
      }

      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
    }
  }

  async hashToken(token: string): Promise<string> {
    return await argon2.hash(token, {
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 4,
      type: argon2.argon2id,
    });
  }

  async verifyTokenHash(tokenHash: string, token: string): Promise<void> {
    const isValid = await argon2.verify(tokenHash, token);

    if (!isValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
    }
  }

  getRefreshTtlDays(): number {
    return Math.floor(this.refreshTtlSeconds / (24 * 60 * 60));
  }
}
