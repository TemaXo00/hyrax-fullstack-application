import { NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { LEADERBOARD_MESSAGES } from '@org/validation-messages';

import { LeaderboardFeatureService } from './leaderboard-feature.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

interface StatisticRecord {
  totalCoinsEarned: bigint;
  totalClicks: bigint;
  streak: number;
}

interface LeaderboardUserRecord {
  id: string;
  nickname: string;
  isBlocked: boolean;
  stats: StatisticRecord | null;
  pet: { name: string; level: number } | null;
}

function buildUser(
  overrides: Partial<LeaderboardUserRecord> = {},
): LeaderboardUserRecord {
  return {
    id: 'user-1',
    nickname: 'Игрок',
    isBlocked: false,
    stats: {
      totalCoinsEarned: BigInt(100),
      totalClicks: BigInt(5),
      streak: 2,
    },
    pet: { name: 'Барсик', level: 3 },
    ...overrides,
  };
}

function setup(): {
  service: LeaderboardFeatureService;
  db: {
    user: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    playerStatistic: { count: jest.Mock };
    pet: { count: jest.Mock };
  };
  redis: { getOrSet: jest.Mock };
} {
  const db = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    playerStatistic: {
      count: jest.fn(),
    },
    pet: {
      count: jest.fn(),
    },
  };
  const redis = {
    getOrSet: jest.fn(),
  };

  redis.getOrSet.mockImplementation(
    async (_key: string, factory: () => Promise<unknown>) => factory(),
  );

  const service = new LeaderboardFeatureService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, redis };
}

describe('LeaderboardFeatureService', () => {
  describe('getLeaderboard', () => {
    it('returns the default metric ordered by earned coins', async () => {
      const { service, db, redis } = setup();

      db.user.count.mockResolvedValue(2);
      db.user.findMany.mockResolvedValue([
        buildUser({
          id: 'user-1',
          nickname: 'Первый',
          stats: {
            totalCoinsEarned: BigInt(300),
            totalClicks: BigInt(1),
            streak: 1,
          },
        }),
        buildUser({
          id: 'user-2',
          nickname: 'Второй',
          stats: {
            totalCoinsEarned: BigInt(200),
            totalClicks: BigInt(9),
            streak: 4,
          },
          pet: { name: 'Мурка', level: 5 },
        }),
      ]);

      const result = await service.getLeaderboard({ page: 1, limit: 10 });

      expect(redis.getOrSet).toHaveBeenCalledWith(
        CACHE_KEYS.leaderboard('TOTAL_COINS_EARNED', 1, 10),
        expect.any(Function),
      );
      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isBlocked: false,
            stats: { isNot: null },
            pet: { isNot: null },
          },
          orderBy: [{ stats: { totalCoinsEarned: 'desc' } }, { id: 'asc' }],
          skip: 0,
          take: 10,
        }),
      );
      expect(result).toMatchObject({
        metric: 'TOTAL_COINS_EARNED',
        metricLabel: 'Всего заработано монет',
        pagination: { page: 1, limit: 10, total: 2 },
        entries: [
          {
            rank: 1,
            userId: 'user-1',
            nickname: 'Первый',
            petName: 'Барсик',
            petLevel: 3,
            value: '300',
          },
          {
            rank: 2,
            userId: 'user-2',
            nickname: 'Второй',
            petName: 'Мурка',
            petLevel: 5,
            value: '200',
          },
        ],
      });
    });

    it('orders by pet level and keeps ranks aligned with the page offset', async () => {
      const { service, db } = setup();

      db.user.count.mockResolvedValue(5);
      db.user.findMany.mockResolvedValue([
        buildUser({ pet: { name: 'Барсик', level: 9 } }),
      ]);

      const result = await service.getLeaderboard({
        page: 2,
        limit: 1,
        metric: 'PET_LEVEL',
      });

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ pet: { level: 'desc' } }, { id: 'asc' }],
          skip: 1,
          take: 1,
        }),
      );
      expect(result.entries[0]).toMatchObject({ rank: 2, value: '9' });
      expect(result.metricLabel).toBe('Уровень питомца');
    });
  });

  describe('getMyPosition', () => {
    it('calculates the rank from players with a better metric value', async () => {
      const { service, db, redis } = setup();

      db.user.findUnique.mockResolvedValue(
        buildUser({
          id: 'user-3',
          stats: {
            totalCoinsEarned: BigInt(150),
            totalClicks: BigInt(7),
            streak: 3,
          },
        }),
      );
      db.user.count.mockResolvedValue(5);
      db.playerStatistic.count.mockResolvedValue(2);

      const result = await service.getMyPosition('user-3', {});

      expect(redis.getOrSet).toHaveBeenCalledWith(
        CACHE_KEYS.leaderboardPosition('TOTAL_COINS_EARNED', 'user-3'),
        expect.any(Function),
      );
      expect(db.playerStatistic.count).toHaveBeenCalledWith({
        where: {
          player: { isBlocked: false },
          OR: [
            { totalCoinsEarned: { gt: BigInt(150) } },
            {
              totalCoinsEarned: BigInt(150),
              playerId: { lt: 'user-3' },
            },
          ],
        },
      });
      expect(result).toEqual({
        metric: 'TOTAL_COINS_EARNED',
        metricLabel: 'Всего заработано монет',
        rank: 3,
        value: '150',
        total: 5,
        isRanked: true,
      });
    });

    it('ranks by pet level and excludes blocked players from the total', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(
        buildUser({ pet: { name: 'Барсик', level: 8 } }),
      );
      db.user.count.mockResolvedValue(4);
      db.pet.count.mockResolvedValue(0);

      const result = await service.getMyPosition('user-1', {
        metric: 'PET_LEVEL',
      });

      expect(db.pet.count).toHaveBeenCalledWith({
        where: {
          user: { isBlocked: false },
          OR: [{ level: { gt: 8 } }, { level: 8, userId: { lt: 'user-1' } }],
        },
      });
      expect(result).toMatchObject({ rank: 1, value: '8', total: 4 });
    });

    it('marks a blocked player as not ranked', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(buildUser({ isBlocked: true }));
      db.user.count.mockResolvedValue(3);
      db.playerStatistic.count.mockResolvedValue(1);

      const result = await service.getMyPosition('user-1', {
        metric: 'TOTAL_CLICKS',
      });

      expect(result).toMatchObject({ rank: 0, value: '5', isRanked: false });
    });

    it('throws when the player has no statistics', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyPosition('missing', {})).rejects.toThrow(
        new NotFoundException(LEADERBOARD_MESSAGES.PLAYER_NOT_FOUND),
      );
    });
  });
});
