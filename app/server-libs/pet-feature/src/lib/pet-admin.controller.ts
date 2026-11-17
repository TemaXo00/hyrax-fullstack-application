import { Body, Param } from '@nestjs/common';
import {
  PaginatedPetsAdminResponseDto,
  PetAdminQueryDto,
  PetAdminResponseDto,
  UpdatePetAdminDto,
  UpdatePlayerStatisticAdminDto,
} from '@org/dto';
import {
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { PET_ADMIN_ROUTES } from '@org/types';
import { PET_MESSAGES } from '@org/validation-messages';

import { PetAdminFeatureService } from './pet-admin-feature.service';

import type { PaginatedPetsAdminOutput, PetAdminEntity } from '@org/types';

@HTTPController({ path: PET_ADMIN_ROUTES.BASE, tag: 'Pets / Admin' })
export class PetAdminController {
  constructor(private readonly service: PetAdminFeatureService) {}

  @QUERYProtectedMethod({
    path: PET_ADMIN_ROUTES.LIST,
    summary: 'Список питомцев',
    operationDesc:
      'Возвращает постраничный список питомцев с владельцами и статистикой. Поддерживает поиск по имени питомца или никнейму владельца и фильтр по уровню. Доступно только администраторам. Возвращаемый тип данных - PaginatedPetsAdminOutput.',
    requestDto: PetAdminQueryDto,
    responseDto: PaginatedPetsAdminResponseDto,
    roles: ['ADMIN'],
  })
  async getPets(
    @Body() dto: PetAdminQueryDto,
  ): Promise<PaginatedPetsAdminOutput> {
    return await this.service.getPets(dto);
  }

  @GETProtectedMethod({
    path: PET_ADMIN_ROUTES.GET_BY_ID,
    summary: 'Питомец по ID',
    operationDesc:
      'Возвращает подробную информацию о питомце, его владельце и статистике. Доступно только администраторам. Возвращаемый тип данных - PetAdminEntity.',
    responseDto: PetAdminResponseDto,
    errors: [
      {
        status: 404,
        description: 'Питомец не найден',
        message: PET_MESSAGES.PET_NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async getPetById(@Param('id') id: string): Promise<PetAdminEntity> {
    return await this.service.getPetById(id);
  }

  @PATCHProtectedMethod({
    path: PET_ADMIN_ROUTES.UPDATE,
    summary: 'Обновление питомца',
    operationDesc:
      'Меняет имя, уровень, опыт, голод или настроение питомца. Доступно только администраторам. Возвращаемый тип данных - PetAdminEntity.',
    requestDto: UpdatePetAdminDto,
    responseDto: PetAdminResponseDto,
    errors: [
      {
        status: 404,
        description: 'Питомец не найден',
        message: PET_MESSAGES.PET_NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async updatePet(
    @Param('id') id: string,
    @Body() dto: UpdatePetAdminDto,
  ): Promise<PetAdminEntity> {
    return await this.service.updatePet(id, dto);
  }

  @PATCHProtectedMethod({
    path: PET_ADMIN_ROUTES.UPDATE_STATISTICS,
    summary: 'Обновление статистики владельца питомца',
    operationDesc:
      'Меняет монеты, счётчики действий, серию входов, силу клика или пассивный доход владельца питомца. Доступно только администраторам. Возвращаемый тип данных - PetAdminEntity.',
    requestDto: UpdatePlayerStatisticAdminDto,
    responseDto: PetAdminResponseDto,
    errors: [
      {
        status: 404,
        description: 'Питомец или статистика игрока не найдены',
        message: PET_MESSAGES.PET_NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async updateStatistics(
    @Param('id') id: string,
    @Body() dto: UpdatePlayerStatisticAdminDto,
  ): Promise<PetAdminEntity> {
    return await this.service.updateStatistics(id, dto);
  }
}
