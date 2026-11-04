import { Body, Param } from '@nestjs/common';
import { BlockUserDto, UserPaginationDto } from '@org/dto';
import {
  CurrentUser,
  DELETEProtectedMethod,
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { AUTH_ADMIN_ROUTES } from '@org/types';

import { AuthAdminFeatureService } from './auth-admin-feature.service';

import type {
  AuthenticatedUser,
  PaginatedUsersOutput,
  SessionEntity,
  UserEntity,
} from '@org/types';

@HTTPController({ path: AUTH_ADMIN_ROUTES.BASE, tag: 'Auth / Admin' })
export class AuthAdminFeatureController {
  constructor(private readonly service: AuthAdminFeatureService) {}

  @QUERYProtectedMethod({
    path: AUTH_ADMIN_ROUTES.GET_USERS,
    summary: 'Список пользователей',
    operationDesc:
      'Возвращает постраничный список пользователей. Поддерживает поиск по никнейму и фильтры по роли и блокировке. Доступно только администраторам. Возвращаемый тип данных - PaginatedUsersOutput.',
    roles: ['ADMIN'],
  })
  async getUsers(
    @Body() dto: UserPaginationDto,
  ): Promise<PaginatedUsersOutput> {
    return await this.service.getUsers(dto);
  }

  @GETProtectedMethod({
    path: AUTH_ADMIN_ROUTES.GET_USER_BY_ID,
    summary: 'Пользователь по ID',
    operationDesc:
      'Возвращает подробную информацию о пользователе. Доступно только администраторам. Возвращаемый тип данных - UserEntity.',
    roles: ['ADMIN'],
  })
  async getUserById(@Param('id') id: string): Promise<UserEntity> {
    return await this.service.getUserById(id);
  }

  @GETProtectedMethod({
    path: AUTH_ADMIN_ROUTES.GET_USER_SESSIONS,
    summary: 'Сессии пользователя',
    operationDesc:
      'Возвращает все активные сессии указанного пользователя. Доступно только администраторам. Возвращаемый тип данных - SessionEntity[].',
    roles: ['ADMIN'],
  })
  async getUserSessions(@Param('id') id: string): Promise<SessionEntity[]> {
    return await this.service.getUserSessions(id);
  }

  @DELETEProtectedMethod({
    path: AUTH_ADMIN_ROUTES.REVOKE_USER_SESSIONS,
    summary: 'Отзыв всех сессий пользователя',
    operationDesc:
      'Удаляет все активные сессии указанного пользователя и пишет запись в журнал действий администратора. Доступно только администраторам. Возвращаемый тип данных - void.',
    roles: ['ADMIN'],
  })
  async revokeUserSessions(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.service.revokeUserSessions(admin.id, id);
  }

  @PATCHProtectedMethod({
    path: AUTH_ADMIN_ROUTES.BLOCK_USER,
    summary: 'Блокировка пользователя',
    operationDesc:
      'Блокирует пользователя, отзывает все его сессии и пишет запись в журнал действий администратора. Доступно только администраторам. Возвращаемый тип данных - UserEntity.',
    roles: ['ADMIN'],
  })
  async blockUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
  ): Promise<UserEntity> {
    return await this.service.blockUser(admin.id, id, dto);
  }

  @PATCHProtectedMethod({
    path: AUTH_ADMIN_ROUTES.UNBLOCK_USER,
    summary: 'Разблокировка пользователя',
    operationDesc:
      'Снимает блокировку с пользователя и пишет запись в журнал действий администратора. Доступно только администраторам. Возвращаемый тип данных - UserEntity.',
    roles: ['ADMIN'],
  })
  async unblockUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<UserEntity> {
    return await this.service.unblockUser(admin.id, id);
  }
}
