import { Body, Param } from '@nestjs/common';
import {
  CosmeticResponseDto,
  CreateCosmeticAdminDto,
  PaginatedCosmeticsResponseDto,
  PaginationDto,
  UpdateCosmeticAdminDto,
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
import { COSMETIC_MESSAGES } from '@org/validation-messages';

import { CosmeticAdminService } from './cosmetic-admin.service';

import type { CosmeticEntity, PaginatedCosmeticsOutput } from '@org/types';

@HTTPController({
  path: SHOP_ADMIN_ROUTES.COSMETICS_BASE,
  tag: 'Shop / Admin / Cosmetics',
})
export class CosmeticAdminController {
  constructor(private readonly service: CosmeticAdminService) {}

  @QUERYProtectedMethod({
    path: SHOP_ADMIN_ROUTES.LIST,
    summary: 'Список косметики',
    operationDesc:
      'Возвращает постраничный список всей косметики, включая недоступную. Поддерживает поиск по названию. Доступно только администраторам. Возвращаемый тип данных - PaginatedCosmeticsOutput.',
    requestDto: PaginationDto,
    responseDto: PaginatedCosmeticsResponseDto,
    roles: ['ADMIN'],
  })
  async getCosmetics(
    @Body() dto: PaginationDto,
  ): Promise<PaginatedCosmeticsOutput> {
    return await this.service.getCosmetics(dto);
  }

  @GETProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Косметика по ID',
    operationDesc:
      'Возвращает косметику по идентификатору независимо от доступности. Доступно только администраторам. Возвращаемый тип данных - CosmeticEntity.',
    responseDto: CosmeticResponseDto,
    errors: [
      {
        status: 404,
        description: 'Косметика не найдена',
        message: COSMETIC_MESSAGES.NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async getCosmeticById(@Param('id') id: string): Promise<CosmeticEntity> {
    return await this.service.getCosmeticById(id);
  }

  @POSTProtectedMethod({
    path: SHOP_ADMIN_ROUTES.LIST,
    summary: 'Создание косметики',
    operationDesc:
      'Создаёт новую позицию каталога косметики. Доступно только администраторам. Возвращаемый тип данных - CosmeticEntity.',
    requestDto: CreateCosmeticAdminDto,
    responseDto: CosmeticResponseDto,
    roles: ['ADMIN'],
  })
  async createCosmetic(
    @Body() dto: CreateCosmeticAdminDto,
  ): Promise<CosmeticEntity> {
    return await this.service.createCosmetic(dto);
  }

  @PATCHProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Обновление косметики',
    operationDesc:
      'Меняет поля позиции каталога косметики. Доступно только администраторам. Возвращаемый тип данных - CosmeticEntity.',
    requestDto: UpdateCosmeticAdminDto,
    responseDto: CosmeticResponseDto,
    errors: [
      {
        status: 404,
        description: 'Косметика не найдена',
        message: COSMETIC_MESSAGES.NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async updateCosmetic(
    @Param('id') id: string,
    @Body() dto: UpdateCosmeticAdminDto,
  ): Promise<CosmeticEntity> {
    return await this.service.updateCosmetic(id, dto);
  }

  @DELETEProtectedMethod({
    path: SHOP_ADMIN_ROUTES.ITEM,
    summary: 'Удаление косметики',
    operationDesc:
      'Удаляет позицию каталога косметики, если она не используется в инвентарях игроков и ежедневных наградах. Доступно только администраторам. Возвращаемый тип данных - void.',
    errors: [
      {
        status: 404,
        description: 'Косметика не найдена',
        message: COSMETIC_MESSAGES.NOT_FOUND,
      },
      {
        status: 409,
        description: 'Косметика используется в инвентарях или наградах',
        message: COSMETIC_MESSAGES.DELETE_CONFLICT,
      },
    ],
    roles: ['ADMIN'],
  })
  async deleteCosmetic(@Param('id') id: string): Promise<void> {
    await this.service.deleteCosmetic(id);
  }
}
