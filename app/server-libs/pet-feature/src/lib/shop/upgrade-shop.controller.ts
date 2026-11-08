import { Body, Param } from '@nestjs/common';
import {
  PaginatedUpgradesResponseDto,
  PaginationDto,
  UpgradePurchaseResponseDto,
} from '@org/dto';
import {
  CurrentUser,
  HTTPController,
  POSTProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { UPGRADE_SHOP_ROUTES } from '@org/types';

import { UpgradeShopService } from './upgrade-shop.service';

import type {
  AuthenticatedUser,
  PaginatedUpgradesOutput,
  UpgradePurchaseEntity,
} from '@org/types';

@HTTPController({ path: UPGRADE_SHOP_ROUTES.BASE, tag: 'Shop / Upgrades' })
export class UpgradeShopController {
  constructor(private readonly service: UpgradeShopService) {}

  @QUERYProtectedMethod({
    path: UPGRADE_SHOP_ROUTES.LIST,
    summary: 'Каталог улучшений',
    operationDesc:
      'Возвращает постраничный список улучшений с текущим уровнем игрока, ценой следующего уровня и поиском по названию. Возвращаемый тип данных - PaginatedUpgradesOutput.',
    requestDto: PaginationDto,
    responseDto: PaginatedUpgradesResponseDto,
  })
  async getUpgrades(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PaginationDto,
  ): Promise<PaginatedUpgradesOutput> {
    return await this.service.getUpgrades(user.id, dto);
  }

  @POSTProtectedMethod({
    path: UPGRADE_SHOP_ROUTES.BUY,
    summary: 'Покупка улучшения',
    operationDesc:
      'Покупает следующий уровень улучшения, списывает монеты и применяет эффект к статистике игрока. Возвращаемый тип данных - UpgradePurchaseEntity.',
    responseDto: UpgradePurchaseResponseDto,
  })
  async buyUpgrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<UpgradePurchaseEntity> {
    return await this.service.buyUpgrade(user.id, { upgradeId: id });
  }
}
