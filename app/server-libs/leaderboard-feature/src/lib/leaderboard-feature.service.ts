import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { buildPaginationMeta, normalizePagination } from '@org/pet-utils';
import { CACHE_KEYS, RedisService } from '@org/redis';
import {
  DEFAULT_LEADERBOARD_METRIC,
  getLeaderboardMetricLabel,
} from '@org/types';
import { LEADERBOARD_MESSAGES } from '@org/validation-messages';

import type { Prisma } from '@org/database';
import type {
  LeaderboardMetric,
  LeaderboardPositionEntity,
  LeaderboardPositionInput,
  LeaderboardQueryInput,
  LeaderboardServiceContract,
  PaginatedLeaderboardOutput,
} from '@org/types';

const LEADERBOARD_INCLUDE = {
  stats: true,
  pet: true,
} satisfies Prisma.UserInclude;

const LEADERBOARD_WHERE = {
  isBlocked: false,
  stats: { isNot: null },
  pet: { isNot: null },
} satisfies Prisma.UserWhereInput;

type LeaderboardRecord = Prisma.UserGetPayload<{
  include: typeof LEADERBOARD_INCLUDE;
}>;

@Injectable()
export class LeaderboardFeatureService implements LeaderboardServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getLeaderboard(
    query: LeaderboardQueryInput,
  ): Promise<PaginatedLeaderboardOutput> {
    const normalized = normalizePagination({
      page: query.page,
      limit: query.limit,
    });
    const metric = query.metric ?? DEFAULT_LEADERBOARD_METRIC;
    const cacheKey = CACHE_KEYS.leaderboard(
      metric,
      normalized.page,
      normalized.limit,
    );

    return await this.redis.getOrSet(cacheKey, async () => {
      const [total, users] = await Promise.all([
        this.db.user.count({ where: LEADERBOARD_WHERE }),
        this.db.user.findMany({
          where: LEADERBOARD_WHERE,
          include: LEADERBOARD_INCLUDE,
          orderBy: this.buildOrderBy(metric),
          skip: normalized.skip,
          take: normalized.limit,
        }),
      ]);

      return {
        pagination: buildPaginationMeta(normalized, total),
        metric,
        metricLabel: getLeaderboardMetricLabel(metric),
        entries: users.map((user, index) => ({
          rank: normalized.skip + index + 1,
          userId: user.id,
          nickname: user.nickname,
          petName: user.pet?.name ?? null,
          petLevel: user.pet?.level ?? null,
          value: String(this.getMetricValue(metric, user)),
        })),
      };
    });
  }

  async getMyPosition(
    userId: string,
    input: LeaderboardPositionInput,
  ): Promise<LeaderboardPositionEntity> {
    const metric = input.metric ?? DEFAULT_LEADERBOARD_METRIC;
    const cacheKey = CACHE_KEYS.leaderboardPosition(metric, userId);

    return await this.redis.getOrSet(cacheKey, async () => {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: LEADERBOARD_INCLUDE,
      });

      if (!user || !user.stats) {
        throw new NotFoundException(LEADERBOARD_MESSAGES.PLAYER_NOT_FOUND);
      }

      const [total, better] = await Promise.all([
        this.db.user.count({ where: LEADERBOARD_WHERE }),
        this.countBetterPlayers(metric, user),
      ]);
      const isRanked = !user.isBlocked && user.pet !== null;

      return {
        metric,
        metricLabel: getLeaderboardMetricLabel(metric),
        rank: isRanked ? better + 1 : 0,
        value: String(this.getMetricValue(metric, user)),
        total,
        isRanked,
      };
    });
  }

  private buildOrderBy(
    metric: LeaderboardMetric,
  ): Prisma.UserOrderByWithRelationInput[] {
    switch (metric) {
      case 'TOTAL_COINS_EARNED':
        return [{ stats: { totalCoinsEarned: 'desc' } }, { id: 'asc' }];
      case 'TOTAL_CLICKS':
        return [{ stats: { totalClicks: 'desc' } }, { id: 'asc' }];
      case 'PET_LEVEL':
        return [{ pet: { level: 'desc' } }, { id: 'asc' }];
      case 'STREAK':
        return [{ stats: { streak: 'desc' } }, { id: 'asc' }];
    }
  }

  private getMetricValue(
    metric: LeaderboardMetric,
    user: LeaderboardRecord,
  ): bigint | number {
    switch (metric) {
      case 'TOTAL_COINS_EARNED':
        return user.stats?.totalCoinsEarned ?? BigInt(0);
      case 'TOTAL_CLICKS':
        return user.stats?.totalClicks ?? BigInt(0);
      case 'PET_LEVEL':
        return user.pet?.level ?? 0;
      case 'STREAK':
        return user.stats?.streak ?? 0;
    }
  }

  private async countBetterPlayers(
    metric: LeaderboardMetric,
    user: LeaderboardRecord,
  ): Promise<number> {
    if (metric === 'PET_LEVEL') {
      const level = user.pet?.level ?? 0;

      return await this.db.pet.count({
        where: {
          user: { isBlocked: false },
          OR: [{ level: { gt: level } }, { level, userId: { lt: user.id } }],
        },
      });
    }

    if (metric === 'TOTAL_COINS_EARNED') {
      const value = user.stats?.totalCoinsEarned ?? BigInt(0);

      return await this.db.playerStatistic.count({
        where: {
          player: { isBlocked: false },
          OR: [
            { totalCoinsEarned: { gt: value } },
            { totalCoinsEarned: value, playerId: { lt: user.id } },
          ],
        },
      });
    }

    if (metric === 'TOTAL_CLICKS') {
      const value = user.stats?.totalClicks ?? BigInt(0);

      return await this.db.playerStatistic.count({
        where: {
          player: { isBlocked: false },
          OR: [
            { totalClicks: { gt: value } },
            { totalClicks: value, playerId: { lt: user.id } },
          ],
        },
      });
    }

    const value = user.stats?.streak ?? 0;

    return await this.db.playerStatistic.count({
      where: {
        player: { isBlocked: false },
        OR: [
          { streak: { gt: value } },
          { streak: value, playerId: { lt: user.id } },
        ],
      },
    });
  }
}
