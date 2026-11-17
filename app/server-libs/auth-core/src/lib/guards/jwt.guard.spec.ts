import { UnauthorizedException } from '@nestjs/common';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthJwtGuard } from './jwt.guard';

import type { AuthSessionValidatorService } from '../services/session-validator.service';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser, AuthJwtPayload } from '@org/types';

interface AuthenticatedRequest {
  user?: AuthJwtPayload | AuthenticatedUser;
}

const BASE_GUARD_PROTOTYPE = Object.getPrototypeOf(AuthJwtGuard.prototype);

function setup(): {
  guard: AuthJwtGuard;
  validator: { validate: jest.Mock };
  request: AuthenticatedRequest;
  context: ExecutionContext;
  superCanActivate: jest.SpyInstance;
} {
  const validator = { validate: jest.fn() };
  const guard = new AuthJwtGuard(
    validator as unknown as AuthSessionValidatorService,
  );
  const request: AuthenticatedRequest = {};
  const context = {
    switchToHttp: (): { getRequest: () => AuthenticatedRequest } => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
  const superCanActivate = jest
    .spyOn(BASE_GUARD_PROTOTYPE, 'canActivate')
    .mockResolvedValue(true);

  return { guard, validator, request, context, superCanActivate };
}

describe('AuthJwtGuard', () => {
  it('заменяет payload на актуального пользователя из валидатора', async () => {
    const { guard, validator, request, context, superCanActivate } = setup();
    const payload: AuthJwtPayload = {
      id: 'user-1',
      sessionId: 'session-1',
      role: 'PLAYER',
    };
    const authenticated: AuthenticatedUser = {
      id: 'user-1',
      sessionId: 'session-1',
      role: 'ADMIN',
      nickname: 'Игрок',
      isBlocked: false,
      createdAt: new Date('2026-11-08T12:00:00.000Z'),
      lastLoginAt: new Date('2026-11-08T12:00:00.000Z'),
    };

    request.user = payload;
    validator.validate.mockResolvedValue(authenticated);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(superCanActivate).toHaveBeenCalledWith(context);
    expect(validator.validate).toHaveBeenCalledWith(payload);
    expect(request.user).toBe(authenticated);
  });

  it('отклоняет запрос без payload', async () => {
    const { guard, validator, context } = setup();

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED),
    );
    expect(validator.validate).not.toHaveBeenCalled();
  });

  it('отклоняет payload без идентификатора сессии', async () => {
    const { guard, validator, request, context } = setup();

    request.user = { id: 'user-1', role: 'PLAYER' } as AuthJwtPayload;

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED),
    );
    expect(validator.validate).not.toHaveBeenCalled();
  });

  it('пробрасывает ошибку валидатора сессии', async () => {
    const { guard, validator, request, context } = setup();
    const error = new UnauthorizedException(AUTH_MESSAGES.SESSION_NOT_FOUND);

    request.user = {
      id: 'user-1',
      sessionId: 'session-1',
      role: 'PLAYER',
    };
    validator.validate.mockRejectedValue(error);

    await expect(guard.canActivate(context)).rejects.toBe(error);
  });

  it('возвращает переведённую ошибку при отсутствии токена', () => {
    const { guard } = setup();

    expect(() => guard.handleRequest(null, false, undefined)).toThrow(
      new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED),
    );
  });

  it('различает истёкший и некорректный токен', () => {
    const { guard } = setup();
    const expired = new Error('jwt expired');
    const invalid = new Error('invalid signature');

    expired.name = 'TokenExpiredError';
    invalid.name = 'JsonWebTokenError';

    expect(() => guard.handleRequest(null, false, expired)).toThrow(
      new UnauthorizedException(AUTH_MESSAGES.TOKEN_EXPIRED),
    );
    expect(() => guard.handleRequest(null, false, invalid)).toThrow(
      new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN),
    );
  });

  it('пропускает пользователя и пробрасывает прочие ошибки', () => {
    const { guard } = setup();
    const payload: AuthJwtPayload = {
      id: 'user-1',
      sessionId: 'session-1',
      role: 'PLAYER',
    };
    const error = new Error('strategy failure');

    expect(guard.handleRequest(null, payload, undefined)).toBe(payload);
    expect(() => guard.handleRequest(error, false, undefined)).toThrow(error);
  });
});
