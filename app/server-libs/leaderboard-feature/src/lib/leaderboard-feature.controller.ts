import { Body } from '@nestjs/common';
import {
  LeaderboardPositionDto,
  LeaderboardPositionResponseDto,
  LeaderboardQueryDto,
  PaginatedLeaderboardResponseDto,
} from '@org/dto';
import {
  CurrentUser,
  HTTPController,
  QUERYProtectedMethod,
} from '@org/http-decorators';
import {
  LEADERBOARD_ROUTES,
  type AuthenticatedUser,
  type LeaderboardPositionEntity,
  type PaginatedLeaderboardOutput,
} from '@org/types';
import { LEADERBOARD_MESSAGES } from '@org/validation-messages';

import { LeaderboardFeatureService } from './leaderboard-feature.service';

@HTTPController({ path: LEADERBOARD_ROUTES.BASE, tag: 'Leaderboard' })
export class LeaderboardFeatureController {
  constructor(private readonly service: LeaderboardFeatureService) {}

  @QUERYProtectedMethod({
    path: LEADERBOARD_ROUTES.LIST,
    summary: 'Рейтинг игроков',
    operationDesc:
      'Возвращает постраничный рейтинг игроков по выбранной метрике. Заблокированные игроки не участвуют в рейтинге. Возвращаемый тип данных - PaginatedLeaderboardOutput.',
    requestDto: LeaderboardQueryDto,
    responseDto: PaginatedLeaderboardResponseDto,
  })
  async getLeaderboard(
    @Body() dto: LeaderboardQueryDto,
  ): Promise<PaginatedLeaderboardOutput> {
    return await this.service.getLeaderboard(dto);
  }

  @QUERYProtectedMethod({
    path: LEADERBOARD_ROUTES.MY_POSITION,
    summary: 'Моя позиция в рейтинге',
    operationDesc:
      'Возвращает место и значение текущего игрока в рейтинге по выбранной метрике. Возвращаемый тип данных - LeaderboardPositionEntity.',
    requestDto: LeaderboardPositionDto,
    responseDto: LeaderboardPositionResponseDto,
    errors: [
      {
        status: 404,
        description: 'Игрок не найден',
        message: LEADERBOARD_MESSAGES.PLAYER_NOT_FOUND,
      },
    ],
  })
  async getMyPosition(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LeaderboardPositionDto,
  ): Promise<LeaderboardPositionEntity> {
    return await this.service.getMyPosition(user.id, dto);
  }
}
