import { UnauthorizedException } from '@nestjs/common';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthWsService } from './ws-auth.service';

import type { AuthSessionValidatorService } from './session-validator.service';
import type { JwtService } from '@nestjs/jwt';
import type { AuthenticatedUser } from '@org/types';

const USER: AuthenticatedUser = {
  id: 'user-1',
  sessionId: 'session-1',
  role: 'PLAYER',
  nickname: 'Тест',
  isBlocked: false,
  createdAt: new Date('2026-11-08T12:00:00.000Z'),
  lastLoginAt: new Date('2026-11-08T12:00:00.000Z'),
};

function setup(): {
  service: AuthWsService;
  jwt: { verifyAsync: jest.Mock };
  validator: { validate: jest.Mock };
} {
  const jwt = {
    verifyAsync: jest.fn(),
  };
  const validator = {
    validate: jest.fn(),
  };
  const service = new AuthWsService(
    jwt as unknown as JwtService,
    validator as unknown as AuthSessionValidatorService,
  );

  return { service, jwt, validator };
}

describe('AuthWsService', () => {
  it('rejects a connection without a token', async () => {
    const { service } = setup();

    await expect(service.authenticate(undefined)).rejects.toThrow(
      AUTH_MESSAGES.UNAUTHORIZED,
    );
  });

  it('rejects an invalid token', async () => {
    const { service, jwt } = setup();

    jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));

    await expect(service.authenticate('bad-token')).rejects.toThrow(
      AUTH_MESSAGES.INVALID_TOKEN,
    );
  });

  it('reports an expired token separately', async () => {
    const { service, jwt } = setup();
    const error = new Error('jwt expired');

    error.name = 'TokenExpiredError';
    jwt.verifyAsync.mockRejectedValue(error);

    await expect(service.authenticate('expired-token')).rejects.toThrow(
      AUTH_MESSAGES.TOKEN_EXPIRED,
    );
  });

  it('rejects a token without user or session identifiers', async () => {
    const { service, jwt } = setup();

    jwt.verifyAsync.mockResolvedValue({ id: 'user-1' });

    await expect(service.authenticate('token')).rejects.toThrow(
      AUTH_MESSAGES.INVALID_TOKEN,
    );
  });

  it('returns the validated user for a valid token', async () => {
    const { service, jwt, validator } = setup();
    const payload = { id: 'user-1', sessionId: 'session-1' };

    jwt.verifyAsync.mockResolvedValue(payload);
    validator.validate.mockResolvedValue(USER);

    const result = await service.authenticate('valid-token');

    expect(result).toBe(USER);
    expect(validator.validate).toHaveBeenCalledWith(payload);
  });

  it('propagates validator errors', async () => {
    const { service, jwt, validator } = setup();

    jwt.verifyAsync.mockResolvedValue({ id: 'user-1', sessionId: 's-1' });
    validator.validate.mockRejectedValue(
      new UnauthorizedException(AUTH_MESSAGES.SESSION_NOT_FOUND),
    );

    await expect(service.authenticate('valid-token')).rejects.toThrow(
      AUTH_MESSAGES.SESSION_NOT_FOUND,
    );
  });
});
