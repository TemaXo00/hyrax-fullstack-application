import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { mapDailyReward } from '@org/pet-mappers';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { DAILY_REWARD_CONFIG } from '@org/validation-config';
import { DAILY_REWARD_MESSAGES } from '@org/validation-messages';

import type {
  DailyRewardClaimEntity,
  DailyRewardServiceContract,
  DailyRewardStateEntity,
} from '@org/types';

function startOfUtcDay(date: Date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);

  return result;
}

function isSameUtcDay(left: Date, right: Date): boolean {
  return startOfUtcDay(left).getTime() === startOfUtcDay(right).getTime();
}

function resolveDayNumber(streak: number): number {
  if (streak <= 0) {
    return DAILY_REWARD_CONFIG.DAY_MIN;
  }

  return ((streak - 1) % DAILY_REWARD_CONFIG.CYCLE_DAYS) + 1;
}

@Injectable()
export class DailyRewardFeatureService implements DailyRewardServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getState(userId: string): Promise<DailyRewardStateEntity> {
    const [streak, rewards] = await Promise.all([
      this.db.loginStreak.findUnique({ where: { userId } }),
      this.db.dailyRewardConfig.findMany({
        include: { rewardItem: true },
        orderBy: { dayNumber: 'asc' },
      }),
    ]);
    const today = startOfUtcDay();
    const lastClaimDate = streak?.lastClaimDate ?? null;
    const canClaim = !lastClaimDate || !isSameUtcDay(lastClaimDate, today);

    let dayNumber: number = DAILY_REWARD_CONFIG.DAY_MIN;

    if (lastClaimDate) {
      dayNumber = isSameUtcDay(lastClaimDate, today)
        ? resolveDayNumber(streak?.currentStreak ?? 0)
        : resolveDayNumber(
            isSameUtcDay(lastClaimDate, addUtcDays(today, -1))
              ? (streak?.currentStreak ?? 0) + 1
              : 1,
          );
    }

    return {
      currentStreak: streak?.currentStreak ?? 0,
      bestStreak: streak?.bestStreak ?? 0,
      lastClaimDate,
      canClaim,
      dayNumber,
      rewards: rewards.map(mapDailyReward),
    };
  }

  async claim(userId: string): Promise<DailyRewardClaimEntity> {
    const today = startOfUtcDay();

    const result = await this.db.$transaction(async (tx) => {
      const [streak, user] = await Promise.all([
        tx.loginStreak.findUnique({ where: { userId } }),
        tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            stats: { select: { id: true } },
          },
        }),
      ]);

      if (!user || !user.stats) {
        throw new NotFoundException(DAILY_REWARD_MESSAGES.PLAYER_NOT_FOUND);
      }

      if (streak && isSameUtcDay(streak.lastClaimDate, today)) {
        throw new ConflictException(DAILY_REWARD_MESSAGES.ALREADY_CLAIMED);
      }

      const previousStreak = streak?.currentStreak ?? 0;
      const continued = streak
        ? isSameUtcDay(streak.lastClaimDate, addUtcDays(today, -1))
        : false;
      const currentStreak = continued ? previousStreak + 1 : 1;
      const bestStreak = Math.max(streak?.bestStreak ?? 0, currentStreak);
      const dayNumber = resolveDayNumber(currentStreak);

      const reward = await tx.dailyRewardConfig.findUnique({
        where: { dayNumber },
        include: { rewardItem: true },
      });

      if (!reward) {
        throw new NotFoundException(DAILY_REWARD_MESSAGES.CONFIG_NOT_FOUND);
      }

      let itemGranted = false;

      if (reward.rewardItemId) {
        const existingItem = await tx.cosmeticInventory.findUnique({
          where: {
            cosmeticId_userId: {
              cosmeticId: reward.rewardItemId,
              userId,
            },
          },
          select: { id: true },
        });

        if (!existingItem) {
          await tx.cosmeticInventory.create({
            data: {
              userId,
              cosmeticId: reward.rewardItemId,
            },
          });
          itemGranted = true;
        }
      }

      await tx.loginStreak.upsert({
        where: { userId },
        create: {
          userId,
          currentStreak,
          bestStreak,
          lastClaimDate: today,
        },
        update: {
          currentStreak,
          bestStreak,
          lastClaimDate: today,
        },
      });

      const stats = await tx.playerStatistic.update({
        where: { playerId: userId },
        data: {
          coins: { increment: reward.rewardCoins },
          totalCoinsEarned: { increment: reward.rewardCoins },
          streak: currentStreak,
        },
      });

      return { reward, stats, currentStreak, bestStreak, itemGranted };
    });

    await Promise.all([
      this.redis.del(CACHE_KEYS.me(userId)),
      this.redis.delByPrefix(CACHE_KEYS.leaderboardPrefix()),
    ]);

    return {
      dayNumber: result.reward.dayNumber,
      rewardCoins: result.reward.rewardCoins,
      rewardItem: mapDailyReward(result.reward).rewardItem,
      itemGranted: result.itemGranted,
      currentStreak: result.currentStreak,
      bestStreak: result.bestStreak,
      lastClaimDate: today,
      canClaim: false,
      coinsBalance: result.stats.coins.toString(),
      totalCoinsEarned: result.stats.totalCoinsEarned.toString(),
    };
  }
}
