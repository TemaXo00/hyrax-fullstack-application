import { Body, Param } from '@nestjs/common';
import {
  CosmeticInventoryResponseDto,
  CosmeticPurchaseResponseDto,
  EquipCosmeticDto,
  PaginatedCosmeticsResponseDto,
  PaginationDto,
} from '@org/dto';
import {
  CurrentUser,
  HTTPController,
  PATCHProtectedMethod,
  POSTProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { COSMETIC_SHOP_ROUTES } from '@org/types';

import { CosmeticShopService } from './cosmetic-shop.service';

import type {
  AuthenticatedUser,
  CosmeticInventoryEntity,
  CosmeticPurchaseEntity,
  PaginatedCosmeticsOutput,
} from '@org/types';

@HTTPController({ path: COSMETIC_SHOP_ROUTES.BASE, tag: 'Shop / Cosmetics' })
export class CosmeticShopController {
  constructor(private readonly service: CosmeticShopService) {}

  @QUERYProtectedMethod({
    path: COSMETIC_SHOP_ROUTES.LIST,
    summary: 'Каталог косметики',
    operationDesc:
      'Возвращает постраничный список активной косметики с поиском по названию. Возвращаемый тип данных - PaginatedCosmeticsOutput.',
    requestDto: PaginationDto,
    responseDto: PaginatedCosmeticsResponseDto,
  })
  async getCosmetics(
    @Body() dto: PaginationDto,
  ): Promise<PaginatedCosmeticsOutput> {
    return await this.service.getCosmetics(dto);
  }

  @POSTProtectedMethod({
    path: COSMETIC_SHOP_ROUTES.BUY,
    summary: 'Покупка косметики',
    operationDesc:
      'Покупает косметику и добавляет её в инвентарь игрока. Списывает монеты с баланса. Возвращаемый тип данных - CosmeticPurchaseEntity.',
    responseDto: CosmeticPurchaseResponseDto,
  })
  async buyCosmetic(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CosmeticPurchaseEntity> {
    return await this.service.buyCosmetic(user.id, id);
  }

  @PATCHProtectedMethod({
    path: COSMETIC_SHOP_ROUTES.EQUIP,
    summary: 'Экипировка косметики',
    operationDesc:
      'Надевает или снимает косметику из инвентаря игрока. В одном слоте может быть экипирован только один предмет. Возвращаемый тип данных - CosmeticInventoryEntity.',
    requestDto: EquipCosmeticDto,
    responseDto: CosmeticInventoryResponseDto,
  })
  async equipCosmetic(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: EquipCosmeticDto,
  ): Promise<CosmeticInventoryEntity> {
    return await this.service.equipCosmetic(user.id, id, dto);
  }
}
