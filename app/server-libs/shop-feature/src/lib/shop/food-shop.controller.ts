import { Body, Param } from '@nestjs/common';
import {
  BuyFoodDto,
  FoodPurchaseResponseDto,
  PaginatedFoodsResponseDto,
  PaginationDto,
} from '@org/dto';
import {
  CurrentUser,
  HTTPController,
  POSTProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { FOOD_SHOP_ROUTES } from '@org/types';

import { FoodShopService } from './food-shop.service';

import type {
  AuthenticatedUser,
  FoodPurchaseEntity,
  PaginatedFoodsOutput,
} from '@org/types';

@HTTPController({ path: FOOD_SHOP_ROUTES.BASE, tag: 'Shop / Foods' })
export class FoodShopController {
  constructor(private readonly service: FoodShopService) {}

  @QUERYProtectedMethod({
    path: FOOD_SHOP_ROUTES.LIST,
    summary: 'Каталог еды',
    operationDesc:
      'Возвращает постраничный список активной еды с поиском по названию. Возвращаемый тип данных - PaginatedFoodsOutput.',
    requestDto: PaginationDto,
    responseDto: PaginatedFoodsResponseDto,
  })
  async getFoods(@Body() dto: PaginationDto): Promise<PaginatedFoodsOutput> {
    return await this.service.getFoods(dto);
  }

  @POSTProtectedMethod({
    path: FOOD_SHOP_ROUTES.BUY,
    summary: 'Покупка еды',
    operationDesc:
      'Покупает указанное количество единиц еды и добавляет их в инвентарь. Списывает монеты с баланса. Возвращаемый тип данных - FoodPurchaseEntity.',
    requestDto: BuyFoodDto,
    responseDto: FoodPurchaseResponseDto,
  })
  async buyFood(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BuyFoodDto,
  ): Promise<FoodPurchaseEntity> {
    return await this.service.buyFood(user.id, {
      foodId: id,
      quantity: dto.quantity,
    });
  }
}
