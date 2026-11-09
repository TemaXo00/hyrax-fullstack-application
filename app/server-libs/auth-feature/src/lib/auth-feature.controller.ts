import { Body, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthCookieService } from '@org/auth-core';
import {
  AuthResponseDto,
  ChangePasswordDto,
  LoginDto,
  MeResponseDto,
  RegisterDto,
} from '@org/dto';
import {
  ClientMetaParam,
  CurrentUser,
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
  POSTMethod,
} from '@org/http-decorators';
import { AUTH_ROUTES } from '@org/types';
import { GAME_CONFIG } from '@org/validation-config';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthFeatureService } from './auth-feature.service';

import type {
  AuthResponse,
  AuthenticatedUser,
  ClientMeta,
  MeEntity,
} from '@org/types';
import type { Request, Response } from 'express';

@HTTPController({ path: AUTH_ROUTES.BASE, tag: 'Auth' })
export class AuthFeatureController {
  constructor(
    private readonly service: AuthFeatureService,
    private readonly cookie: AuthCookieService,
  ) {}

  @Throttle({
    default: {
      limit: GAME_CONFIG.THROTTLE.AUTH_LIMIT,
      ttl: GAME_CONFIG.THROTTLE.AUTH_TTL_MS,
    },
  })
  @POSTMethod({
    path: AUTH_ROUTES.REGISTER,
    summary: 'Регистрация пользователя',
    operationDesc:
      'Создаёт аккаунт, инициализирует сессию и выдаёт пару JWT-токенов. Refresh-токен сохраняется в httpOnly cookie. Возвращаемый тип данных - AuthResponse.',
    requestDto: RegisterDto,
    responseDto: AuthResponseDto,
    errors: [
      {
        status: 400,
        description: 'Некорректные данные регистрации',
        message: AUTH_MESSAGES.PASSWORDS_NOT_SIMILAR,
      },
      {
        status: 409,
        description: 'Пользователь с таким никнеймом уже существует',
        message: AUTH_MESSAGES.USER_WITH_NICKNAME_EXISTS,
      },
    ],
  })
  async register(
    @Body() dto: RegisterDto,
    @ClientMetaParam() meta: ClientMeta,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.service.register(dto, meta);

    this.cookie.setRefreshToken(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Throttle({
    default: {
      limit: GAME_CONFIG.THROTTLE.AUTH_LIMIT,
      ttl: GAME_CONFIG.THROTTLE.AUTH_TTL_MS,
    },
  })
  @POSTMethod({
    path: AUTH_ROUTES.LOGIN,
    summary: 'Авторизация пользователя',
    operationDesc:
      'Проверяет никнейм и пароль, создаёт новую сессию и выдаёт пару JWT-токенов. Refresh-токен сохраняется в httpOnly cookie. Возвращаемый тип данных - AuthResponse.',
    requestDto: LoginDto,
    responseDto: AuthResponseDto,
    errors: [
      {
        status: 401,
        description: 'Неверный никнейм или пароль',
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      },
      {
        status: 403,
        description: 'Пользователь заблокирован',
        message: 'Пользователь заблокирован. Причина: нарушение правил',
      },
    ],
  })
  async login(
    @Body() dto: LoginDto,
    @ClientMetaParam() meta: ClientMeta,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.service.login(dto, meta);

    this.cookie.setRefreshToken(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Throttle({
    default: {
      limit: GAME_CONFIG.THROTTLE.AUTH_LIMIT,
      ttl: GAME_CONFIG.THROTTLE.AUTH_TTL_MS,
    },
  })
  @POSTMethod({
    path: AUTH_ROUTES.REFRESH,
    summary: 'Обновление пары токенов',
    operationDesc:
      'Использует refresh-токен из httpOnly cookie для выдачи новой пары JWT-токенов. Новый refresh-токен перезаписывает старую cookie. Возвращаемый тип данных - AuthResponse.',
    responseDto: AuthResponseDto,
    errors: [
      {
        status: 401,
        description: 'Refresh-токен отсутствует или недействителен',
        message: AUTH_MESSAGES.INVALID_TOKEN,
      },
    ],
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @ClientMetaParam() meta: ClientMeta,
  ): Promise<AuthResponse> {
    const refreshToken = this.cookie.getRefreshToken(req);

    try {
      const result = await this.service.refresh(refreshToken, meta);

      this.cookie.setRefreshToken(res, result.refreshToken);

      return {
        accessToken: result.accessToken,
        user: result.user,
      };
    } catch (error) {
      this.cookie.removeRefreshToken(res);
      throw error;
    }
  }

  @POSTMethod({
    path: AUTH_ROUTES.LOGOUT,
    summary: 'Выход из текущей сессии',
    operationDesc:
      'Удаляет текущую сессию и делает её JWT-токены недействительными. Cookie с refresh-токеном очищается. Возвращаемый тип данных - void.',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = this.cookie.getOptionalRefreshToken(req);

    try {
      await this.service.logout(refreshToken);
    } finally {
      this.cookie.removeRefreshToken(res);
    }
  }

  @GETProtectedMethod({
    path: AUTH_ROUTES.ME,
    summary: 'Текущий пользователь',
    operationDesc:
      'Возвращает аккаунт текущего авторизованного пользователя вместе с питомцем, статистикой, инвентарём, улучшениями и достижениями. Возвращаемый тип данных - MeEntity.',
    responseDto: MeResponseDto,
    errors: [
      {
        status: 404,
        description: 'Пользователь не найден',
        message: AUTH_MESSAGES.USER_NOT_FOUND,
      },
    ],
  })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeEntity> {
    return await this.service.me(user.id);
  }

  @PATCHProtectedMethod({
    path: AUTH_ROUTES.CHANGE_PASSWORD,
    summary: 'Смена пароля',
    operationDesc:
      'Обновляет пароль текущего пользователя. Для подтверждения требуется текущий пароль. Возвращаемый тип данных - void.',
    requestDto: ChangePasswordDto,
    errors: [
      {
        status: 400,
        description: 'Некорректные данные смены пароля',
        message: AUTH_MESSAGES.SAME_PASSWORD,
      },
      {
        status: 401,
        description: 'Текущий пароль указан неверно',
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      },
    ],
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.service.changePassword(user.id, user.sessionId, dto);
  }
}
