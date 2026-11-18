import { ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { DAILY_REWARD_MESSAGES } from '@org/validation-messages';

import { DailyRewardAdminService } from './daily-reward-admin.service';
import { DailyRewardFeatureService } from './daily-reward-feature.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-18T12:00:00.000Z');
const TODAY = new Date('2026-11-18T00:00:00.000Z');
const YESTERDAY = new Date('2026-11-17T00:00:00.000Z');

function buildCosmetic(): Record<string, unknown> {
  return {
    id: 'cosmetic-1',
    name: 'Кепка',
    description: 'Простая кепка',
    price: 100,
    imageUrl: null,
    isActive: true,
    slot: 'HAT',
    rarity: 'COMMON',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function buildReward(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'reward-1',
    dayNumber: 1,
    rewardCoins: 50,
    rewardItemId: null,
    rewardItem: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

interface DailyRewardSetup {
  service: DailyRewardFeatureService;
  adminService: DailyRewardAdminService;
  db: {
    loginStreak: { findUnique: jest.Mock; upsert: jest.Mock };
    dailyRewardConfig: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: { findUnique: jest.Mock };
    cosmeticInventory: { findUnique: jest.Mock; create: jest.Mock };
    cosmetic: { findUnique: jest.Mock };
    playerStatistic: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  tx: {
    loginStreak: { findUnique: jest.Mock; upsert: jest.Mock };
    user: { findUnique: jest.Mock };
    dailyRewardConfig: { findUnique: jest.Mock };
    cosmeticInventory: { findUnique: jest.Mock; create: jest.Mock };
    playerStatistic: { update: jest.Mock };
  };
  redis: { del: jest.Mock; delByPrefix: jest.Mock };
}

function setup(): DailyRewardSetup {
  const tx = {
    loginStreak: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    dailyRewardConfig: {
      findUnique: jest.fn(),
    },
    cosmeticInventory: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    playerStatistic: {
      update: jest.fn(),
    },
  };
  const db = {
    loginStreak: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    dailyRewardConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    cosmeticInventory: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cosmetic: {
      findUnique: jest.fn(),
    },
    playerStatistic: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const redis = {
    del: jest.fn().mockResolvedValue(undefined),
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new DailyRewardFeatureService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );
  const adminService = new DailyRewardAdminService(
    db as unknown as DatabaseService,
  );

  return { service, adminService, db, tx, redis };
}

describe('DailyRewardFeatureService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the first reward day for a player without a streak', async () => {
    const { service, db } = setup();

    db.loginStreak.findUnique.mockResolvedValue(null);
    db.dailyRewardConfig.findMany.mockResolvedValue([buildReward()]);

    const result = await service.getState('user-1');

    expect(result).toMatchObject({
      currentStreak: 0,
      bestStreak: 0,
      lastClaimDate: null,
      canClaim: true,
      dayNumber: 1,
      rewards: [{ dayNumber: 1, rewardCoins: 50 }],
    });
  });

  it('reports that today was already claimed', async () => {
    const { service, db } = setup();

    db.loginStreak.findUnique.mockResolvedValue({
      currentStreak: 2,
      bestStreak: 3,
      lastClaimDate: TODAY,
    });
    db.dailyRewardConfig.findMany.mockResolvedValue([buildReward()]);

    const result = await service.getState('user-1');

    expect(result).toMatchObject({
      currentStreak: 2,
      canClaim: false,
      dayNumber: 2,
    });
  });

  it('claims the first reward and updates the streak', async () => {
    const { service, tx, redis } = setup();

    tx.loginStreak.findUnique.mockResolvedValue(null);
    tx.user.findUnique.mockResolvedValue({
      id: 'user-1',
      stats: { id: 'stats-1' },
    });
    tx.dailyRewardConfig.findUnique.mockResolvedValue(buildReward());
    tx.loginStreak.upsert.mockResolvedValue({});
    tx.playerStatistic.update.mockResolvedValue({
      coins: BigInt(150),
      totalCoinsEarned: BigInt(950),
    });

    const result = await service.claim('user-1');

    expect(tx.loginStreak.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: {
        userId: 'user-1',
        currentStreak: 1,
        bestStreak: 1,
        lastClaimDate: TODAY,
      },
      update: {
        currentStreak: 1,
        bestStreak: 1,
        lastClaimDate: TODAY,
      },
    });
    expect(tx.playerStatistic.update).toHaveBeenCalledWith({
      where: { playerId: 'user-1' },
      data: {
        coins: { increment: 50 },
        totalCoinsEarned: { increment: 50 },
        streak: 1,
      },
    });
    expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me('user-1'));
    expect(redis.delByPrefix).toHaveBeenCalledWith(
      CACHE_KEYS.leaderboardPrefix(),
    );
    expect(result).toMatchObject({
      dayNumber: 1,
      rewardCoins: 50,
      itemGranted: false,
      currentStreak: 1,
      bestStreak: 1,
      lastClaimDate: TODAY,
      canClaim: false,
      coinsBalance: '150',
      totalCoinsEarned: '950',
    });
  });

  it('continues the streak and grants a reward item once', async () => {
    const { service, db, tx } = setup();
    const reward = buildReward({
      dayNumber: 3,
      rewardCoins: 100,
      rewardItemId: 'cosmetic-1',
      rewardItem: buildCosmetic(),
    });

    tx.loginStreak.findUnique.mockResolvedValue({
      currentStreak: 2,
      bestStreak: 2,
      lastClaimDate: YESTERDAY,
    });
    tx.user.findUnique.mockResolvedValue({
      id: 'user-1',
      stats: { id: 'stats-1' },
    });
    tx.dailyRewardConfig.findUnique.mockResolvedValue(reward);
    tx.cosmeticInventory.findUnique.mockResolvedValue(null);
    tx.cosmeticInventory.create.mockResolvedValue({});
    tx.loginStreak.upsert.mockResolvedValue({});
    tx.playerStatistic.update.mockResolvedValue({
      coins: BigInt(200),
      totalCoinsEarned: BigInt(1200),
    });

    const result = await service.claim('user-1');

    expect(tx.cosmeticInventory.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', cosmeticId: 'cosmetic-1' },
    });
    expect(result).toMatchObject({
      dayNumber: 3,
      rewardCoins: 100,
      rewardItem: { id: 'cosmetic-1', slotLabel: 'Головной убор' },
      itemGranted: true,
      currentStreak: 3,
      bestStreak: 3,
    });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects a repeated daily claim', async () => {
    const { service, tx } = setup();

    tx.loginStreak.findUnique.mockResolvedValue({
      currentStreak: 1,
      bestStreak: 1,
      lastClaimDate: TODAY,
    });
    tx.user.findUnique.mockResolvedValue({
      id: 'user-1',
      stats: { id: 'stats-1' },
    });

    await expect(service.claim('user-1')).rejects.toThrow(
      new ConflictException(DAILY_REWARD_MESSAGES.ALREADY_CLAIMED),
    );
  });
});

describe('DailyRewardAdminService', () => {
  it('updates a reward and returns the mapped entity', async () => {
    const { adminService, db } = setup();

    db.dailyRewardConfig.findUnique.mockResolvedValue({ id: 'reward-1' });
    db.cosmetic.findUnique.mockResolvedValue({ id: 'cosmetic-1' });
    db.dailyRewardConfig.update.mockResolvedValue(
      buildReward({
        rewardCoins: 500,
        rewardItemId: 'cosmetic-1',
        rewardItem: buildCosmetic(),
      }),
    );

    const result = await adminService.updateReward(1, {
      rewardCoins: 500,
      rewardItemId: 'cosmetic-1',
    });

    expect(db.dailyRewardConfig.update).toHaveBeenCalledWith({
      where: { dayNumber: 1 },
      data: { rewardCoins: 500, rewardItemId: 'cosmetic-1' },
      include: { rewardItem: true },
    });
    expect(result).toMatchObject({
      dayNumber: 1,
      rewardCoins: 500,
      rewardItem: { id: 'cosmetic-1' },
    });
  });

  it('rejects an unknown reward day', async () => {
    const { adminService, db } = setup();

    db.dailyRewardConfig.findUnique.mockResolvedValue(null);

    await expect(
      adminService.updateReward(1, { rewardCoins: 100 }),
    ).rejects.toThrow(
      new NotFoundException(DAILY_REWARD_MESSAGES.CONFIG_NOT_FOUND),
    );
  });
});
