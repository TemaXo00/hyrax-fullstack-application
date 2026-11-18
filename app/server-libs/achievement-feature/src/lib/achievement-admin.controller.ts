import { Body, Param } from '@nestjs/common';
import {
  AchievementQueryDto,
  AchievementResponseDto,
  CreateAchievementAdminDto,
  PaginatedAchievementCatalogResponseDto,
  UpdateAchievementAdminDto,
} from '@org/dto';
import {
  DELETEProtectedMethod,
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
  POSTProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { ACHIEVEMENT_ADMIN_ROUTES } from '@org/types';
import { ACHIEVEMENT_MESSAGES } from '@org/validation-messages';

import { AchievementAdminService } from './achievement-admin.service';

import type {
  AchievementEntity,
  PaginatedAchievementCatalogOutput,
} from '@org/types';

@HTTPController({
  path: ACHIEVEMENT_ADMIN_ROUTES.BASE,
  tag: 'Achievements / Admin',
})
export class AchievementAdminController {
  constructor(private readonly service: AchievementAdminService) {}

  @QUERYProtectedMethod({
    path: ACHIEVEMENT_ADMIN_ROUTES.LIST,
    summary: 'Список достижений',
    operationDesc:
      'Возвращает постраничный список достижений каталога. Доступно только администраторам. Возвращаемый тип данных - PaginatedAchievementCatalogOutput.',
    requestDto: AchievementQueryDto,
    responseDto: PaginatedAchievementCatalogResponseDto,
    roles: ['ADMIN'],
  })
  async getAchievements(
    @Body() dto: AchievementQueryDto,
  ): Promise<PaginatedAchievementCatalogOutput> {
    return await this.service.getAchievements(dto);
  }

  @GETProtectedMethod({
    path: ACHIEVEMENT_ADMIN_ROUTES.ITEM,
    summary: 'Достижение по ID',
    operationDesc:
      'Возвращает достижение по идентификатору. Доступно только администраторам. Возвращаемый тип данных - AchievementEntity.',
    responseDto: AchievementResponseDto,
    errors: [
      {
        status: 404,
        description: 'Достижение не найдено',
        message: ACHIEVEMENT_MESSAGES.NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async getAchievementById(
    @Param('id') id: string,
  ): Promise<AchievementEntity> {
    return await this.service.getAchievementById(id);
  }

  @POSTProtectedMethod({
    path: ACHIEVEMENT_ADMIN_ROUTES.LIST,
    summary: 'Создание достижения',
    operationDesc:
      'Создаёт новое достижение. Доступно только администраторам. Возвращаемый тип данных - AchievementEntity.',
    requestDto: CreateAchievementAdminDto,
    responseDto: AchievementResponseDto,
    errors: [
      {
        status: 409,
        description: 'Достижение с таким кодом уже существует',
        message: ACHIEVEMENT_MESSAGES.CODE_CONFLICT,
      },
    ],
    roles: ['ADMIN'],
  })
  async createAchievement(
    @Body() dto: CreateAchievementAdminDto,
  ): Promise<AchievementEntity> {
    return await this.service.createAchievement(dto);
  }

  @PATCHProtectedMethod({
    path: ACHIEVEMENT_ADMIN_ROUTES.ITEM,
    summary: 'Обновление достижения',
    operationDesc:
      'Меняет поля достижения. Доступно только администраторам. Возвращаемый тип данных - AchievementEntity.',
    requestDto: UpdateAchievementAdminDto,
    responseDto: AchievementResponseDto,
    errors: [
      {
        status: 404,
        description: 'Достижение не найдено',
        message: ACHIEVEMENT_MESSAGES.NOT_FOUND,
      },
      {
        status: 409,
        description: 'Достижение с таким кодом уже существует',
        message: ACHIEVEMENT_MESSAGES.CODE_CONFLICT,
      },
    ],
    roles: ['ADMIN'],
  })
  async updateAchievement(
    @Param('id') id: string,
    @Body() dto: UpdateAchievementAdminDto,
  ): Promise<AchievementEntity> {
    return await this.service.updateAchievement(id, dto);
  }

  @DELETEProtectedMethod({
    path: ACHIEVEMENT_ADMIN_ROUTES.ITEM,
    summary: 'Удаление достижения',
    operationDesc:
      'Удаляет достижение, если оно не получено ни одним игроком. Доступно только администраторам. Возвращаемый тип данных - void.',
    errors: [
      {
        status: 404,
        description: 'Достижение не найдено',
        message: ACHIEVEMENT_MESSAGES.NOT_FOUND,
      },
      {
        status: 409,
        description: 'Достижение получено игроками',
        message: ACHIEVEMENT_MESSAGES.DELETE_CONFLICT,
      },
    ],
    roles: ['ADMIN'],
  })
  async deleteAchievement(@Param('id') id: string): Promise<void> {
    await this.service.deleteAchievement(id);
  }
}
