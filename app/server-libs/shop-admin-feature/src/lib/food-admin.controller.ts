import { Body, Param } from '@nestjs/common';
import {
  CreateFoodAdminDto,
  FoodResponseDto,
  PaginatedFoodsResponseDto,
  PaginationDto,
  UpdateFoodAdminDto,
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
import { FOOD_MESSAGES } from '@org/validation-messages';

import { FoodAdminService } from './food-admin.service';

import type { FoodEntity, PaginatedFoodsOutput } from '@org/types';

@HTTPController({
  path: SHOP_ADMIN_ROUTES.FOODS_BASE,
  tag: 'Shop / Admin / Foods',
})
export class FoodAdminController {
  constructor(private readonly service: FoodAdminService) {}

  @QUERYProtectedMethod({
    path: SHOP_ADMIN_ROUTES.LIST,
    summary: 'Список еды',
    operationDesc:
      'Возвращает постраничный список всей еды, включая недоступную. Поддерживает поиск по названию. Доступно только администраторам. Возвращаемый тип данных - PaginatedFoodsOutput.',
    requestDto: PaginationDto,
    responseDto: PaginatedFoodsResponseDto,
    roles: ['ADMIN'],
  })
  async getFoods(@Body() dto: PaginationDto): Promise<PaginatedFoodsOutput> {
    return await this.service.getFoods(dto);
  }

  @GETProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Еда по ID',
    operationDesc:
      'Возвращает еду по идентификатору независимо от доступности. Доступно только администраторам. Возвращаемый тип данных - FoodEntity.',
    responseDto: FoodResponseDto,
    errors: [
      {
        status: 404,
        description: 'Еда не найдена',
        message: FOOD_MESSAGES.NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async getFoodById(@Param('id') id: string): Promise<FoodEntity> {
    return await this.service.getFoodById(id);
  }

  @POSTProtectedMethod({
    path: SHOP_ADMIN_ROUTES.LIST,
    summary: 'Создание еды',
    operationDesc:
      'Создаёт новую позицию каталога еды. Доступно только администраторам. Возвращаемый тип данных - FoodEntity.',
    requestDto: CreateFoodAdminDto,
    responseDto: FoodResponseDto,
    roles: ['ADMIN'],
  })
  async createFood(@Body() dto: CreateFoodAdminDto): Promise<FoodEntity> {
    return await this.service.createFood(dto);
  }

  @PATCHProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Обновление еды',
    operationDesc:
      'Меняет поля позиции каталога еды. Доступно только администраторам. Возвращаемый тип данных - FoodEntity.',
    requestDto: UpdateFoodAdminDto,
    responseDto: FoodResponseDto,
    errors: [
      {
        status: 404,
        description: 'Еда не найдена',
        message: FOOD_MESSAGES.NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async updateFood(
    @Param('id') id: string,
    @Body() dto: UpdateFoodAdminDto,
  ): Promise<FoodEntity> {
    return await this.service.updateFood(id, dto);
  }

  @DELETEProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Удаление еды',
    operationDesc:
      'Удаляет позицию каталога еды, если она не используется в инвентарях игроков. Доступно только администраторам. Возвращаемый тип данных - void.',
    errors: [
      {
        status: 404,
        description: 'Еда не найдена',
        message: FOOD_MESSAGES.NOT_FOUND,
      },
      {
        status: 409,
        description: 'Еда используется в инвентарях игроков',
        message: FOOD_MESSAGES.DELETE_CONFLICT,
      },
    ],
    roles: ['ADMIN'],
  })
  async deleteFood(@Param('id') id: string): Promise<void> {
    await this.service.deleteFood(id);
  }
}
