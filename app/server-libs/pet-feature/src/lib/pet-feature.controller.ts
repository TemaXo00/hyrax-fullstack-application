import { Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  FeedPetDto,
  PetActionResultResponseDto,
  PetResponseDto,
  PetStateResponseDto,
  RenamePetDto,
} from '@org/dto';
import {
  CurrentUser,
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
  POSTProtectedMethod,
} from '@org/http-decorators';
import { PET_ROUTES } from '@org/types';
import { GAME_CONFIG } from '@org/validation-config';

import { PetFeatureService } from './pet-feature.service';

import type {
  AuthenticatedUser,
  PetActionResultEntity,
  PetEntity,
  PetStateEntity,
} from '@org/types';

@HTTPController({ path: PET_ROUTES.BASE, tag: 'Pets' })
export class PetFeatureController {
  constructor(private readonly service: PetFeatureService) {}

  @GETProtectedMethod({
    path: PET_ROUTES.STATE,
    summary: 'Состояние питомца',
    operationDesc:
      'Возвращает питомца, статистику игрока, инвентарь, улучшения, параметры затухания настроения и голода, а также начисленный пассивный доход. Возвращаемый тип данных - PetStateEntity.',
    responseDto: PetStateResponseDto,
  })
  async getState(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PetStateEntity> {
    return await this.service.getState(user.id);
  }

  @PATCHProtectedMethod({
    path: PET_ROUTES.RENAME,
    summary: 'Переименование питомца',
    operationDesc:
      'Меняет имя питомца текущего игрока. Возвращаемый тип данных - PetEntity.',
    requestDto: RenamePetDto,
    responseDto: PetResponseDto,
  })
  async rename(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RenamePetDto,
  ): Promise<PetEntity> {
    return await this.service.rename(user.id, dto);
  }

  @Throttle({
    default: {
      limit: GAME_CONFIG.THROTTLE.CLICK_LIMIT,
      ttl: GAME_CONFIG.THROTTLE.CLICK_TTL_MS,
    },
  })
  @POSTProtectedMethod({
    path: PET_ROUTES.CLICK,
    summary: 'Клик по питомцу',
    operationDesc:
      'Начисляет монеты за клик с учётом силы клика и настроения питомца, добавляет опыт и может повысить уровень. Возвращаемый тип данных - PetActionResultEntity.',
    responseDto: PetActionResultResponseDto,
  })
  async click(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PetActionResultEntity> {
    return await this.service.click(user.id);
  }

  @Throttle({
    default: {
      limit: GAME_CONFIG.THROTTLE.WALK_LIMIT,
      ttl: GAME_CONFIG.THROTTLE.WALK_TTL_MS,
    },
  })
  @POSTProtectedMethod({
    path: PET_ROUTES.WALK,
    summary: 'Выгул питомца',
    operationDesc:
      'Начисляет повышенную награду за выгул, повышает настроение, снижает голод и добавляет опыт. Действие имеет кулдаун. Возвращаемый тип данных - PetActionResultEntity.',
    responseDto: PetActionResultResponseDto,
  })
  async walk(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PetActionResultEntity> {
    return await this.service.walk(user.id);
  }

  @POSTProtectedMethod({
    path: PET_ROUTES.FEED,
    summary: 'Кормление питомца',
    operationDesc:
      'Списывает одну единицу еды из инвентаря, восстанавливает голод и настроение, добавляет опыт. Возвращаемый тип данных - PetActionResultEntity.',
    requestDto: FeedPetDto,
    responseDto: PetActionResultResponseDto,
  })
  async feed(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: FeedPetDto,
  ): Promise<PetActionResultEntity> {
    return await this.service.feed(user.id, dto);
  }
}
