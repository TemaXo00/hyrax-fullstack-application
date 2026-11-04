import { Body, Req, Res } from '@nestjs/common';
import { AuthCookieService } from '@org/auth-core';
import { ChangePasswordDto, LoginDto, RegisterDto } from '@org/dto';
import {
  ClientMetaParam,
  CurrentUser,
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
  POSTMethod,
} from '@org/http-decorators';
import { AUTH_ROUTES } from '@org/types';

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

  @POSTMethod({
    path: AUTH_ROUTES.REGISTER,
    summary: 'Регистрация пользователя',
    operationDesc:
      'Создаёт аккаунт, инициализирует сессию и выдаёт пару JWT-токенов. Refresh-токен сохраняется в httpOnly cookie. Возвращаемый тип данных - AuthResponse.',
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

  @POSTMethod({
    path: AUTH_ROUTES.LOGIN,
    summary: 'Авторизация пользователя',
    operationDesc:
      'Проверяет никнейм и пароль, создаёт новую сессию и выдаёт пару JWT-токенов. Refresh-токен сохраняется в httpOnly cookie. Возвращаемый тип данных - AuthResponse.',
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

  @POSTMethod({
    path: AUTH_ROUTES.REFRESH,
    summary: 'Обновление пары токенов',
    operationDesc:
      'Использует refresh-токен из httpOnly cookie для выдачи новой пары JWT-токенов. Новый refresh-токен перезаписывает старую cookie. Возвращаемый тип данных - AuthResponse.',
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
  })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeEntity> {
    return await this.service.me(user.id);
  }

  @PATCHProtectedMethod({
    path: AUTH_ROUTES.CHANGE_PASSWORD,
    summary: 'Смена пароля',
    operationDesc:
      'Обновляет пароль текущего пользователя. Для подтверждения требуется текущий пароль. Возвращаемый тип данных - void.',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.service.changePassword(user.id, user.sessionId, dto);
  }
}
