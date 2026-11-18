import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { mapAchievement } from '@org/pet-mappers';
import { buildPaginationMeta, normalizePagination } from '@org/pet-utils';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { ACHIEVEMENT_MESSAGES } from '@org/validation-messages';

import type { Achievment, Prisma } from '@org/database';
import type {
  AchievementClaimEntity,
  AchievementCondition,
  AchievementEntity,
  AchievementProgressEntity,
  AchievementQueryInput,
  AchievementServiceContract,
  PaginatedAchievementsOutput,
} from '@org/types';

const ACHIEVEMENT_USER_SELECT = {
  id: true,
  stats: {
    select: {
      totalClicks: true,
      totalFeeds: true,
      totalCoinsEarned: true,
      streak: true,
    },
  },
  pet: {
    select: {
      level: true,
    },
  },
} satisfies Prisma.UserSelect;

type AchievementUserView = Prisma.UserGetPayload<{
  select: typeof ACHIEVEMENT_USER_SELECT;
}>;

type ClaimedAchievement = {
  achievmentId: string;
  createdAt: Date;
};

function toSafeNumber(value: bigint | number): number {
  if (typeof value === 'number') {
    return value;
  }

  return value > BigInt(Number.MAX_SAFE_INTEGER)
    ? Number.MAX_SAFE_INTEGER
    : Number(value);
}

@Injectable()
export class AchievementFeatureService implements AchievementServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getAchievements(
    userId: string,
    query: AchievementQueryInput,
  ): Promise<PaginatedAchievementsOutput> {
    const normalized = normalizePagination(query);
    const where: Prisma.AchievmentWhereInput = {};

    if (normalized.search) {
      where.OR = [
        { code: { contains: normalized.search, mode: 'insensitive' } },
        { title: { contains: normalized.search, mode: 'insensitive' } },
      ];
    }

    if (query.conditionType) {
      where.conditionType = query.conditionType;
    }

    const [total, achievements, user] = await Promise.all([
      this.db.achievment.count({ where }),
      this.db.achievment.findMany({
        where,
        orderBy: [
          { conditionType: 'asc' },
          { conditionValue: 'asc' },
          { id: 'asc' },
        ],
        skip: normalized.skip,
        take: normalized.limit,
      }),
      this.findUser(userId),
    ]);

    const claimed = achievements.length
      ? await this.db.userAchievment.findMany({
          where: {
            userId,
            achievmentId: { in: achievements.map((item) => item.id) },
          },
          select: { achievmentId: true, createdAt: true },
        })
      : [];

    const claimedById = new Map<string, ClaimedAchievement>(
      claimed.map((item) => [item.achievmentId, item]),
    );

    return {
      pagination: buildPaginationMeta(normalized, total),
      achievements: achievements.map((achievement) => {
        const claim = claimedById.get(achievement.id);

        return this.buildProgress(achievement, user, claim?.createdAt ?? null);
      }),
    };
  }

  async claim(
    userId: string,
    achievementId: string,
  ): Promise<AchievementClaimEntity> {
    const achievement = await this.findAchievement(achievementId);
    const user = await this.findUser(userId);

    const existing = await this.db.userAchievment.findUnique({
      where: {
        userId_achievmentId: {
          userId,
          achievmentId: achievementId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(ACHIEVEMENT_MESSAGES.ALREADY_CLAIMED);
    }

    const value = this.getConditionValue(achievement.conditionType, user);

    if (value < achievement.conditionValue) {
      throw new BadRequestException(ACHIEVEMENT_MESSAGES.NOT_UNLOCKED);
    }

    const result = await this.db.$transaction(async (tx) => {
      const userAchievement = await tx.userAchievment.create({
        data: {
          userId,
          achievmentId: achievementId,
        },
      });
      const stats = await tx.playerStatistic.update({
        where: { playerId: userId },
        data: {
          coins: { increment: achievement.rewardCoins },
          totalCoinsEarned: { increment: achievement.rewardCoins },
        },
      });

      return { userAchievement, stats };
    });

    await Promise.all([
      this.redis.del(CACHE_KEYS.me(userId)),
      this.redis.delByPrefix(CACHE_KEYS.leaderboardPrefix()),
    ]);

    return {
      achievement: this.buildProgress(
        achievement,
        user,
        result.userAchievement.createdAt,
      ),
      rewardCoins: achievement.rewardCoins,
      coinsBalance: result.stats.coins.toString(),
      totalCoinsEarned: result.stats.totalCoinsEarned.toString(),
    };
  }

  private buildProgress(
    achievement: Achievment,
    user: AchievementUserView,
    claimedAt: Date | null,
  ): AchievementProgressEntity {
    const value = this.getConditionValue(achievement.conditionType, user);
    const mapped: AchievementEntity = mapAchievement(achievement);

    return {
      ...mapped,
      progress: Math.min(value, achievement.conditionValue),
      isUnlocked: value >= achievement.conditionValue,
      isClaimed: claimedAt !== null,
      claimedAt,
    };
  }

  private getConditionValue(
    conditionType: AchievementCondition,
    user: AchievementUserView,
  ): number {
    switch (conditionType) {
      case 'TOTAL_CLICKS':
        return toSafeNumber(user.stats?.totalClicks ?? BigInt(0));
      case 'TOTAL_FEEDS':
        return toSafeNumber(user.stats?.totalFeeds ?? BigInt(0));
      case 'LEVEL':
        return user.pet?.level ?? 0;
      case 'TOTAL_COINS_EARNED':
        return toSafeNumber(user.stats?.totalCoinsEarned ?? BigInt(0));
      case 'STREAK':
        return user.stats?.streak ?? 0;
    }
  }

  private async findAchievement(achievementId: string): Promise<Achievment> {
    const achievement = await this.db.achievment.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new NotFoundException(ACHIEVEMENT_MESSAGES.NOT_FOUND);
    }

    return achievement;
  }

  private async findUser(userId: string): Promise<AchievementUserView> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: ACHIEVEMENT_USER_SELECT,
    });

    if (!user || !user.stats) {
      throw new NotFoundException(ACHIEVEMENT_MESSAGES.PLAYER_NOT_FOUND);
    }

    return user;
  }
}
