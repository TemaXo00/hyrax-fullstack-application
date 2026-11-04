import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthTokenService } from './token.service';

import type { Request, Response } from 'express';

@Injectable()
export class AuthCookieService {
  private readonly isDev: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly token: AuthTokenService,
  ) {
    this.isDev = this.config.get<string>('HYRAX_DEV_MODE', 'false') === 'true';
  }

  setRefreshToken(res: Response, token: string): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + this.token.getRefreshTtlDays());

    res.cookie('refreshToken', token, {
      expires,
      sameSite: 'lax',
      httpOnly: true,
      secure: !this.isDev,
    });
  }

  removeRefreshToken(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: !this.isDev,
      sameSite: 'lax',
    });
  }

  getRefreshToken(req: Request): string {
    const token = this.getOptionalRefreshToken(req);

    if (!token) {
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED);
    }

    return token;
  }

  getOptionalRefreshToken(req: Request): string | undefined {
    const cookies = req.cookies as
      Record<string, string | undefined> | undefined;

    return cookies?.['refreshToken'];
  }
}
