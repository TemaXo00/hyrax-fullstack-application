import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthTokenService } from './token.service';

import type { AuthJwtPayload } from '@org/types';

const PAYLOAD: AuthJwtPayload = {
  id: 'user-1',
  sessionId: 'session-1',
  role: 'PLAYER',
};

const SECRET = 'test-secret';

function setup(): {
  service: AuthTokenService;
  jwt: JwtService;
} {
  const jwt = new JwtService({ secret: SECRET });
  const config = {
    get: jest.fn((_key: string, defaultValue: string | number) => defaultValue),
  } as unknown as ConfigService;

  return { service: new AuthTokenService(jwt, config), jwt };
}

describe('AuthTokenService', () => {
  it('generates a verifiable access and refresh pair', () => {
    const { service, jwt } = setup();

    const tokens = service.generateTokens(PAYLOAD);

    expect(jwt.verify(tokens.accessToken)).toMatchObject(PAYLOAD);
    expect(service.verifyRefreshToken(tokens.refreshToken)).toMatchObject(
      PAYLOAD,
    );
  });

  it('rejects an invalid refresh token', () => {
    const { service } = setup();

    expect(() => service.verifyRefreshToken('invalid')).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an expired refresh token', () => {
    const { service, jwt } = setup();
    const expired = jwt.sign(PAYLOAD, { secret: SECRET, expiresIn: -1 });

    expect(() => service.verifyRefreshToken(expired)).toThrow(
      AUTH_MESSAGES.TOKEN_EXPIRED,
    );
  });

  it('hashes and verifies a refresh token', async () => {
    const { service } = setup();
    const hash = await service.hashToken('refresh-token');

    await expect(
      service.verifyTokenHash(hash, 'refresh-token'),
    ).resolves.toBeUndefined();
    await expect(service.verifyTokenHash(hash, 'another')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('calculates the refresh token ttl in days', () => {
    const { service } = setup();

    expect(service.getRefreshTtlDays()).toBe(30);
  });
});
