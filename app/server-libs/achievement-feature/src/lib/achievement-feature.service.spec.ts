import { BadRequestException, ConflictException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { ACHIEVEMENT_MESSAGES } from '@org/validation-messages';

import { AchievementAdminService } from './achievement-admin.service';
import { AchievementFeatureService } from './achievement-feature.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-18T12:00:00.000Z');

function buildAchievement(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'achievement-1',
    code: 'FIRST_CLICKS',
    title: 'Первые клики',
    description: 'Сделайте десять кликов',
    imageUrl: null,
    conditionType: 'TOTAL_CLICKS',
    conditionValue: 10,
    rewardCoins: 50,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildUser(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'user-1',
    stats: {
      totalClicks: BigInt(12),
      totalFeeds: BigInt(2),
      totalCoinsEarned: BigInt(120),
      streak: 3,
    },
    pet: { level: 4 },
    ...overrides,
  };
}

interface AchievementSetup {
  service: AchievementFeatureService;
  adminService: AchievementAdminService;
  db: {
    achievment: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    user: { findUnique: jest.Mock };
    userAchievment: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
    };
    playerStatistic: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  tx: {
    userAchievment: { create: jest.Mock };
    playerStatistic: { update: jest.Mock };
  };
  redis: { del: jest.Mock; delByPrefix: jest.Mock };
}

function setup(): AchievementSetup {
  const tx = {
    userAchievment: {
      create: jest.fn(),
    },
    playerStatistic: {
      update: jest.fn(),
    },
  };
  const db = {
    achievment: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userAchievment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
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
  const service = new AchievementFeatureService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );
  const adminService = new AchievementAdminService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, adminService, db, tx, redis };
}

describe('AchievementFeatureService', () => {
  it('returns achievements with progress and claim status', async () => {
    const { service, db } = setup();

    db.achievment.count.mockResolvedValue(1);
    db.achievment.findMany.mockResolvedValue([buildAchievement()]);
    db.user.findUnique.mockResolvedValue(buildUser());
    db.userAchievment.findMany.mockResolvedValue([
      { achievmentId: 'achievement-1', createdAt: NOW },
    ]);

    const result = await service.getAchievements('user-1', {
      page: 1,
      limit: 10,
    });

    expect(db.achievment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [
          { conditionType: 'asc' },
          { conditionValue: 'asc' },
          { id: 'asc' },
        ],
        skip: 0,
        take: 10,
      }),
    );
    expect(result).toMatchObject({
      pagination: { page: 1, limit: 10, total: 1 },
      achievements: [
        {
          id: 'achievement-1',
          conditionTypeLabel: 'Всего кликов',
          progress: 10,
          isUnlocked: true,
          isClaimed: true,
          claimedAt: NOW,
        },
      ],
    });
  });

  it('filters achievements by condition type and search', async () => {
    const { service, db } = setup();

    db.achievment.count.mockResolvedValue(0);
    db.achievment.findMany.mockResolvedValue([]);
    db.user.findUnique.mockResolvedValue(buildUser());

    await service.getAchievements('user-1', {
      search: 'клик',
      conditionType: 'TOTAL_CLICKS',
    });

    expect(db.achievment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { code: { contains: 'клик', mode: 'insensitive' } },
            { title: { contains: 'клик', mode: 'insensitive' } },
          ],
          conditionType: 'TOTAL_CLICKS',
        },
      }),
    );
  });

  it('claims an unlocked achievement and awards coins', async () => {
    const { service, db, tx, redis } = setup();

    db.achievment.findUnique.mockResolvedValue(buildAchievement());
    db.user.findUnique.mockResolvedValue(buildUser());
    db.userAchievment.findUnique.mockResolvedValue(null);
    tx.userAchievment.create.mockResolvedValue({
      id: 'user-achievement-1',
      createdAt: NOW,
    });
    tx.playerStatistic.update.mockResolvedValue({
      coins: BigInt(150),
      totalCoinsEarned: BigInt(170),
    });

    const result = await service.claim('user-1', 'achievement-1');

    expect(tx.playerStatistic.update).toHaveBeenCalledWith({
      where: { playerId: 'user-1' },
      data: {
        coins: { increment: 50 },
        totalCoinsEarned: { increment: 50 },
      },
    });
    expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me('user-1'));
    expect(redis.delByPrefix).toHaveBeenCalledWith(
      CACHE_KEYS.leaderboardPrefix(),
    );
    expect(result).toMatchObject({
      achievement: {
        id: 'achievement-1',
        progress: 10,
        isUnlocked: true,
        isClaimed: true,
        claimedAt: NOW,
      },
      rewardCoins: 50,
      coinsBalance: '150',
      totalCoinsEarned: '170',
    });
  });

  it('rejects a claim when the condition is not met', async () => {
    const { service, db } = setup();

    db.achievment.findUnique.mockResolvedValue(buildAchievement());
    db.user.findUnique.mockResolvedValue(
      buildUser({
        stats: {
          totalClicks: BigInt(2),
          totalFeeds: BigInt(0),
          totalCoinsEarned: BigInt(10),
          streak: 0,
        },
      }),
    );
    db.userAchievment.findUnique.mockResolvedValue(null);

    await expect(service.claim('user-1', 'achievement-1')).rejects.toThrow(
      new BadRequestException(ACHIEVEMENT_MESSAGES.NOT_UNLOCKED),
    );
  });

  it('rejects a repeated claim', async () => {
    const { service, db } = setup();

    db.achievment.findUnique.mockResolvedValue(buildAchievement());
    db.user.findUnique.mockResolvedValue(buildUser());
    db.userAchievment.findUnique.mockResolvedValue({ id: 'claimed-1' });

    await expect(service.claim('user-1', 'achievement-1')).rejects.toThrow(
      new ConflictException(ACHIEVEMENT_MESSAGES.ALREADY_CLAIMED),
    );
  });
});

describe('AchievementAdminService', () => {
  it('rejects a duplicate achievement code', async () => {
    const { adminService, db } = setup();

    db.achievment.findUnique.mockResolvedValue({ id: 'achievement-1' });

    await expect(
      adminService.createAchievement({
        code: 'FIRST_CLICKS',
        title: 'Первые клики',
        conditionType: 'TOTAL_CLICKS',
        conditionValue: 10,
      }),
    ).rejects.toThrow(
      new ConflictException(ACHIEVEMENT_MESSAGES.CODE_CONFLICT),
    );
  });

  it('rejects deleting a claimed achievement', async () => {
    const { adminService, db } = setup();

    db.achievment.findUnique.mockResolvedValue(buildAchievement());
    db.userAchievment.count.mockResolvedValue(1);

    await expect(
      adminService.deleteAchievement('achievement-1'),
    ).rejects.toThrow(
      new ConflictException(ACHIEVEMENT_MESSAGES.DELETE_CONFLICT),
    );
  });
});
