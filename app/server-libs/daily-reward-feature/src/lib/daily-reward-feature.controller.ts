import {
  DailyRewardClaimResponseDto,
  DailyRewardStateResponseDto,
} from '@org/dto';
import {
  CurrentUser,
  HTTPController,
  POSTProtectedMethod,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import { DAILY_REWARD_ROUTES } from '@org/types';
import { DAILY_REWARD_MESSAGES } from '@org/validation-messages';

import { DailyRewardFeatureService } from './daily-reward-feature.service';

import type {
  AuthenticatedUser,
  DailyRewardClaimEntity,
  DailyRewardStateEntity,
} from '@org/types';

@HTTPController({ path: DAILY_REWARD_ROUTES.BASE, tag: 'Daily rewards' })
export class DailyRewardFeatureController {
  constructor(private readonly service: DailyRewardFeatureService) {}

  @QUERYProtectedMethod({
    path: DAILY_REWARD_ROUTES.STATE,
    summary: 'Состояние ежедневных наград',
    operationDesc:
      'Возвращает календарь наград, текущую серию входов и доступность награды за сегодня. Возвращаемый тип данных - DailyRewardStateEntity.',
    responseDto: DailyRewardStateResponseDto,
  })
  async getState(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DailyRewardStateEntity> {
    return await this.service.getState(user.id);
  }

  @POSTProtectedMethod({
    path: DAILY_REWARD_ROUTES.CLAIM,
    summary: 'Получение ежедневной награды',
    operationDesc:
      'Выдаёт награду за текущий день, обновляет серию входов и начисляет монеты. Возвращаемый тип данных - DailyRewardClaimEntity.',
    responseDto: DailyRewardClaimResponseDto,
    errors: [
      {
        status: 404,
        description: 'Игрок или конфигурация награды не найдены',
        message: DAILY_REWARD_MESSAGES.PLAYER_NOT_FOUND,
      },
      {
        status: 409,
        description: 'Награда за сегодня уже получена',
        message: DAILY_REWARD_MESSAGES.ALREADY_CLAIMED,
      },
    ],
  })
  async claim(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DailyRewardClaimEntity> {
    return await this.service.claim(user.id);
  }
}
