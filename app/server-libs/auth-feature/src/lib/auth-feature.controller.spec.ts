import { UnauthorizedException } from '@nestjs/common';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthFeatureController } from './auth-feature.controller';

import type { AuthFeatureService } from './auth-feature.service';
import type { AuthCookieService } from '@org/auth-core';
import type {
  AuthSessionResult,
  ChangePasswordInput,
  MeEntity,
  UserEntity,
} from '@org/types';
import type { Request, Response } from 'express';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const META = { ip: '127.0.0.1', userAgent: 'jest' };

const USER: UserEntity = {
  id: 'user-1',
  nickname: 'Игрок',
  role: 'PLAYER',
  roleLabel: 'Игрок',
  isBlocked: false,
  blockedUntil: null,
  blockReason: null,
  createdAt: NOW,
  lastLoginAt: NOW,
};

const SESSION_RESULT: AuthSessionResult = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: USER,
};

interface Setup {
  controller: AuthFeatureController;
  service: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    me: jest.Mock;
    changePassword: jest.Mock;
  };
  cookie: {
    setRefreshToken: jest.Mock;
    removeRefreshToken: jest.Mock;
    getRefreshToken: jest.Mock;
    getOptionalRefreshToken: jest.Mock;
  };
  res: { cookie: jest.Mock; clearCookie: jest.Mock };
}

function setup(): Setup {
  const service = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
    changePassword: jest.fn(),
  };
  const cookie = {
    setRefreshToken: jest.fn(),
    removeRefreshToken: jest.fn(),
    getRefreshToken: jest.fn(),
    getOptionalRefreshToken: jest.fn(),
  };
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };

  return {
    controller: new AuthFeatureController(
      service as unknown as AuthFeatureService,
      cookie as unknown as AuthCookieService,
    ),
    service,
    cookie,
    res,
  };
}

describe('AuthFeatureController', () => {
  it('регистрирует пользователя и сохраняет refresh-токен в cookie', async () => {
    const { controller, service, cookie, res } = setup();

    service.register.mockResolvedValue(SESSION_RESULT);

    await expect(
      controller.register(
        {
          nickname: 'Игрок',
          password: 'Secret123',
          passwordConfirmation: 'Secret123',
        },
        META,
        res as unknown as Response,
      ),
    ).resolves.toEqual({ accessToken: 'access-token', user: USER });

    expect(service.register).toHaveBeenCalledWith(
      {
        nickname: 'Игрок',
        password: 'Secret123',
        passwordConfirmation: 'Secret123',
      },
      META,
    );
    expect(cookie.setRefreshToken).toHaveBeenCalledWith(res, 'refresh-token');
  });

  it('авторизует пользователя и сохраняет refresh-токен в cookie', async () => {
    const { controller, service, cookie, res } = setup();

    service.login.mockResolvedValue(SESSION_RESULT);

    await expect(
      controller.login(
        { nickname: 'Игрок', password: 'Secret123' },
        META,
        res as unknown as Response,
      ),
    ).resolves.toEqual({ accessToken: 'access-token', user: USER });

    expect(service.login).toHaveBeenCalledWith(
      { nickname: 'Игрок', password: 'Secret123' },
      META,
    );
    expect(cookie.setRefreshToken).toHaveBeenCalledWith(res, 'refresh-token');
  });

  it('обновляет токены по refresh-cookie', async () => {
    const { controller, service, cookie, res } = setup();

    cookie.getRefreshToken.mockReturnValue('old-refresh-token');
    service.refresh.mockResolvedValue(SESSION_RESULT);

    await expect(
      controller.refresh({} as Request, res as unknown as Response, META),
    ).resolves.toEqual({ accessToken: 'access-token', user: USER });

    expect(cookie.getRefreshToken).toHaveBeenCalled();
    expect(service.refresh).toHaveBeenCalledWith('old-refresh-token', META);
    expect(cookie.setRefreshToken).toHaveBeenCalledWith(res, 'refresh-token');
  });

  it('очищает cookie при неудачном обновлении токенов', async () => {
    const { controller, service, cookie, res } = setup();
    const error = new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);

    cookie.getRefreshToken.mockReturnValue('invalid-refresh-token');
    service.refresh.mockRejectedValue(error);

    await expect(
      controller.refresh({} as Request, res as unknown as Response, META),
    ).rejects.toBe(error);
    expect(cookie.removeRefreshToken).toHaveBeenCalledWith(res);
  });

  it('завершает сессию и очищает cookie', async () => {
    const { controller, service, cookie, res } = setup();

    cookie.getOptionalRefreshToken.mockReturnValue('refresh-token');
    service.logout.mockResolvedValue(undefined);

    await expect(
      controller.logout({} as Request, res as unknown as Response),
    ).resolves.toBeUndefined();
    expect(service.logout).toHaveBeenCalledWith('refresh-token');
    expect(cookie.removeRefreshToken).toHaveBeenCalledWith(res);
  });

  it('очищает cookie даже при ошибке завершения сессии', async () => {
    const { controller, service, cookie, res } = setup();

    cookie.getOptionalRefreshToken.mockReturnValue(undefined);
    service.logout.mockRejectedValue(new Error('storage is unavailable'));

    await expect(
      controller.logout({} as Request, res as unknown as Response),
    ).rejects.toThrow('storage is unavailable');
    expect(service.logout).toHaveBeenCalledWith(undefined);
    expect(cookie.removeRefreshToken).toHaveBeenCalledWith(res);
  });

  it('возвращает профиль текущего пользователя', async () => {
    const { controller, service } = setup();
    const profile = { ...USER, pet: null } as unknown as MeEntity;

    service.me.mockResolvedValue(profile);

    await expect(
      controller.me({
        id: 'user-1',
        sessionId: 'session-1',
        role: 'PLAYER',
        nickname: 'Игрок',
        isBlocked: false,
        createdAt: NOW,
        lastLoginAt: NOW,
      }),
    ).resolves.toBe(profile);
    expect(service.me).toHaveBeenCalledWith('user-1');
  });

  it('меняет пароль текущего пользователя', async () => {
    const { controller, service } = setup();
    const dto: ChangePasswordInput = {
      oldPassword: 'Secret123',
      newPassword: 'NewSecret123',
      newPasswordConfirmation: 'NewSecret123',
    };

    service.changePassword.mockResolvedValue(undefined);

    await expect(
      controller.changePassword(
        {
          id: 'user-1',
          sessionId: 'session-1',
          role: 'PLAYER',
          nickname: 'Игрок',
          isBlocked: false,
          createdAt: NOW,
          lastLoginAt: NOW,
        },
        dto,
      ),
    ).resolves.toBeUndefined();
    expect(service.changePassword).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      dto,
    );
  });
});
