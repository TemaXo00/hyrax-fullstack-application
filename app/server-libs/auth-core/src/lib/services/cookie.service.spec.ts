import { ConfigService } from '@nestjs/config';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthCookieService } from './cookie.service';

import type { AuthTokenService } from './token.service';
import type { Request, Response } from 'express';

function setup(isDev = true): {
  service: AuthCookieService;
  res: { cookie: jest.Mock; clearCookie: jest.Mock };
} {
  const config = {
    get: jest.fn().mockReturnValue(String(isDev)),
  } as unknown as ConfigService;
  const token = {
    getRefreshTtlDays: jest.fn().mockReturnValue(7),
  } as unknown as AuthTokenService;
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };

  return {
    service: new AuthCookieService(config, token),
    res,
  };
}

describe('AuthCookieService', () => {
  it('sets an httpOnly refresh cookie', () => {
    const { service, res } = setup();

    service.setRefreshToken(res as unknown as Response, 'refresh-token');

    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        sameSite: 'lax',
        httpOnly: true,
        secure: false,
      }),
    );
  });

  it('uses a secure cookie outside development', () => {
    const { service, res } = setup(false);

    service.setRefreshToken(res as unknown as Response, 'refresh-token');

    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({ secure: true }),
    );
  });

  it('removes the refresh cookie', () => {
    const { service, res } = setup();

    service.removeRefreshToken(res as unknown as Response);

    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });

  it('reads an optional refresh token', () => {
    const { service } = setup();
    const req = { cookies: { refreshToken: 'refresh-token' } };

    expect(service.getOptionalRefreshToken(req as unknown as Request)).toBe(
      'refresh-token',
    );
    expect(
      service.getOptionalRefreshToken({ cookies: {} } as unknown as Request),
    ).toBeUndefined();
  });

  it('throws when the refresh token is missing', () => {
    const { service } = setup();

    expect(() =>
      service.getRefreshToken({ cookies: {} } as unknown as Request),
    ).toThrow(AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED);
  });

  it('returns the refresh token when present', () => {
    const { service } = setup();

    expect(
      service.getRefreshToken({
        cookies: { refreshToken: 'refresh-token' },
      } as unknown as Request),
    ).toBe('refresh-token');
  });
});
