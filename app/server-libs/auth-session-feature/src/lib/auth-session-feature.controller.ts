import { Body, Param } from '@nestjs/common';
import { ChangeSessionLocalNameDto } from '@org/dto';
import {
  CurrentUser,
  DELETEProtectedMethod,
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
} from '@org/http-decorators';
import { AUTH_SESSION_ROUTES } from '@org/types';

import { AuthSessionFeatureService } from './auth-session-feature.service';

import type { AuthenticatedUser, SessionEntity } from '@org/types';

@HTTPController({ path: AUTH_SESSION_ROUTES.BASE, tag: 'Auth / Sessions' })
export class AuthSessionFeatureController {
  constructor(private readonly service: AuthSessionFeatureService) {}

  @GETProtectedMethod({
    path: AUTH_SESSION_ROUTES.GET_MY_SESSIONS,
    summary: 'Мои сессии',
    operationDesc:
      'Возвращает все активные сессии текущего пользователя. Возвращаемый тип данных - SessionEntity[].',
  })
  async getMySessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionEntity[]> {
    return await this.service.getMySessions(user.id, user.sessionId);
  }

  @PATCHProtectedMethod({
    path: AUTH_SESSION_ROUTES.CHANGE_LOCAL_NAME,
    summary: 'Переименование сессии',
    operationDesc:
      'Меняет отображаемое название одной из сессий текущего пользователя. Возвращаемый тип данных - SessionEntity.',
  })
  async changeLocalName(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ChangeSessionLocalNameDto,
  ): Promise<SessionEntity> {
    return await this.service.changeLocalName(user.id, id, user.sessionId, dto);
  }

  @DELETEProtectedMethod({
    path: AUTH_SESSION_ROUTES.DELETE_SESSION,
    summary: 'Удаление сессии',
    operationDesc:
      'Удаляет одну из сессий текущего пользователя, кроме текущей. Для выхода из текущей сессии используйте logout. Возвращаемый тип данных - void.',
  })
  async deleteSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.service.deleteSession(user.id, id, user.sessionId);
  }

  @DELETEProtectedMethod({
    path: AUTH_SESSION_ROUTES.DELETE_ALL_SESSIONS,
    summary: 'Удаление остальных сессий',
    operationDesc:
      'Удаляет все сессии текущего пользователя, кроме текущей. Возвращаемый тип данных - void.',
  })
  async deleteAllSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.service.deleteAllSessions(user.id, user.sessionId);
  }
}
