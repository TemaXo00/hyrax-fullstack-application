import { Body, Param } from '@nestjs/common';
import {
  AchievementClaimResponseDto,
  AchievementQueryDto,
  PaginatedAchievementsResponseDto,
} from '@org/dto';
import {
  CurrentUser,
  HTTPController,
  POSTProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { ACHIEVEMENT_ROUTES } from '@org/types';
import { ACHIEVEMENT_MESSAGES } from '@org/validation-messages';

import { AchievementFeatureService } from './achievement-feature.service';

import type {
  AchievementClaimEntity,
  AuthenticatedUser,
  PaginatedAchievementsOutput,
} from '@org/types';

@HTTPController({ path: ACHIEVEMENT_ROUTES.BASE, tag: 'Achievements' })
export class AchievementFeatureController {
  constructor(private readonly service: AchievementFeatureService) {}

  @QUERYProtectedMethod({
    path: ACHIEVEMENT_ROUTES.LIST,
    summary: 'Список достижений',
    operationDesc:
      'Возвращает постраничный список достижений с прогрессом и статусом получения текущего игрока. Возвращаемый тип данных - PaginatedAchievementsOutput.',
    requestDto: AchievementQueryDto,
    responseDto: PaginatedAchievementsResponseDto,
  })
  async getAchievements(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AchievementQueryDto,
  ): Promise<PaginatedAchievementsOutput> {
    return await this.service.getAchievements(user.id, dto);
  }

  @POSTProtectedMethod({
    path: ACHIEVEMENT_ROUTES.CLAIM,
    summary: 'Получение достижения',
    operationDesc:
      'Выдаёт достижение и награду в монетах, если условие выполнено. Возвращаемый тип данных - AchievementClaimEntity.',
    responseDto: AchievementClaimResponseDto,
    errors: [
      {
        status: 404,
        description: 'Достижение не найдено',
        message: ACHIEVEMENT_MESSAGES.NOT_FOUND,
      },
      {
        status: 400,
        description: 'Условия получения не выполнены',
        message: ACHIEVEMENT_MESSAGES.NOT_UNLOCKED,
      },
      {
        status: 409,
        description: 'Достижение уже получено',
        message: ACHIEVEMENT_MESSAGES.ALREADY_CLAIMED,
      },
    ],
  })
  async claim(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AchievementClaimEntity> {
    return await this.service.claim(user.id, id);
  }
}
