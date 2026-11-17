import { Body, Param } from '@nestjs/common';
import {
  CreateUpgradeAdminDto,
  PaginatedUpgradesAdminResponseDto,
  PaginationDto,
  UpdateUpgradeAdminDto,
  UpgradeResponseDto,
} from '@org/dto';
import {
  DELETEProtectedMethod,
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
  POSTProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { SHOP_ADMIN_ROUTES } from '@org/types';
import { UPGRADE_MESSAGES } from '@org/validation-messages';

import { UpgradeAdminService } from './upgrade-admin.service';

import type { PaginatedUpgradesAdminOutput, UpgradeEntity } from '@org/types';

@HTTPController({
  path: SHOP_ADMIN_ROUTES.UPGRADES_BASE,
  tag: 'Shop / Admin / Upgrades',
})
export class UpgradeAdminController {
  constructor(private readonly service: UpgradeAdminService) {}

  @QUERYProtectedMethod({
    path: SHOP_ADMIN_ROUTES.LIST,
    summary: 'Список улучшений',
    operationDesc:
      'Возвращает постраничный список всех улучшений. Поддерживает поиск по названию. Доступно только администраторам. Возвращаемый тип данных - PaginatedUpgradesAdminOutput.',
    requestDto: PaginationDto,
    responseDto: PaginatedUpgradesAdminResponseDto,
    roles: ['ADMIN'],
  })
  async getUpgrades(
    @Body() dto: PaginationDto,
  ): Promise<PaginatedUpgradesAdminOutput> {
    return await this.service.getUpgrades(dto);
  }

  @GETProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Улучшение по ID',
    operationDesc:
      'Возвращает улучшение по идентификатору. Доступно только администраторам. Возвращаемый тип данных - UpgradeEntity.',
    responseDto: UpgradeResponseDto,
    errors: [
      {
        status: 404,
        description: 'Улучшение не найдено',
        message: UPGRADE_MESSAGES.NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async getUpgradeById(@Param('id') id: string): Promise<UpgradeEntity> {
    return await this.service.getUpgradeById(id);
  }

  @POSTProtectedMethod({
    path: SHOP_ADMIN_ROUTES.LIST,
    summary: 'Создание улучшения',
    operationDesc:
      'Создаёт новую позицию каталога улучшений. Доступно только администраторам. Возвращаемый тип данных - UpgradeEntity.',
    requestDto: CreateUpgradeAdminDto,
    responseDto: UpgradeResponseDto,
    roles: ['ADMIN'],
  })
  async createUpgrade(
    @Body() dto: CreateUpgradeAdminDto,
  ): Promise<UpgradeEntity> {
    return await this.service.createUpgrade(dto);
  }

  @PATCHProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Обновление улучшения',
    operationDesc:
      'Меняет поля позиции каталога улучшений. Доступно только администраторам. Возвращаемый тип данных - UpgradeEntity.',
    requestDto: UpdateUpgradeAdminDto,
    responseDto: UpgradeResponseDto,
    errors: [
      {
        status: 404,
        description: 'Улучшение не найдено',
        message: UPGRADE_MESSAGES.NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async updateUpgrade(
    @Param('id') id: string,
    @Body() dto: UpdateUpgradeAdminDto,
  ): Promise<UpgradeEntity> {
    return await this.service.updateUpgrade(id, dto);
  }

  @DELETEProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Удаление улучшения',
    operationDesc:
      'Удаляет позицию каталога улучшений, если она не куплена игроками. Доступно только администраторам. Возвращаемый тип данных - void.',
    errors: [
      {
        status: 404,
        description: 'Улучшение не найдено',
        message: UPGRADE_MESSAGES.NOT_FOUND,
      },
      {
        status: 409,
        description: 'Улучшение уже куплено игроками',
        message: UPGRADE_MESSAGES.DELETE_CONFLICT,
      },
    ],
    roles: ['ADMIN'],
  })
  async deleteUpgrade(@Param('id') id: string): Promise<void> {
    await this.service.deleteUpgrade(id);
  }
}
