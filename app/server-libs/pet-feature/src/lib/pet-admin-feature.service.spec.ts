import { NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { PET_MESSAGES } from '@org/validation-messages';

import { PetAdminFeatureService } from './pet-admin-feature.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';
const PET_ID = 'pet-1';

interface StatsRecord {
  id: string;
  coins: bigint;
  totalCoinsEarned: bigint;
  totalClicks: bigint;
  totalFeeds: bigint;
  streak: number;
  clickPower: number;
  autoIncome: number;
  lastSyncAt: Date;
  playerId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PetAdminRecord {
  id: string;
  name: string;
  level: number;
  xp: number;
  hunger: number;
  mood: number;
  lastMoodAt: Date;
  lastHungerAt: Date;
  lastWalkAt: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    nickname: string;
    role: 'PLAYER' | 'ADMIN';
    isBlocked: boolean;
    stats: StatsRecord | null;
  };
}

function buildStats(overrides: Partial<StatsRecord> = {}): StatsRecord {
  return {
    id: 'stats-1',
    coins: 100n,
    totalCoinsEarned: 200n,
    totalClicks: 30n,
    totalFeeds: 4n,
    streak: 2,
    clickPower: 3,
    autoIncome: 1,
    lastSyncAt: NOW,
    playerId: USER_ID,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildPet(overrides: Partial<PetAdminRecord> = {}): PetAdminRecord {
  return {
    id: PET_ID,
    name: 'Барсик',
    level: 3,
    xp: 40,
    hunger: 80,
    mood: 65,
    lastMoodAt: NOW,
    lastHungerAt: NOW,
    lastWalkAt: null,
    userId: USER_ID,
    createdAt: NOW,
    updatedAt: NOW,
    user: {
      id: USER_ID,
      nickname: 'Тест',
      role: 'PLAYER',
      isBlocked: false,
      stats: buildStats(),
    },
    ...overrides,
  };
}

function setup(): {
  service: PetAdminFeatureService;
  db: {
    pet: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    playerStatistic: { update: jest.Mock };
  };
  redis: { del: jest.Mock; delByPrefix: jest.Mock };
} {
  const db = {
    pet: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    playerStatistic: {
      update: jest.fn(),
    },
  };
  const redis = {
    del: jest.fn().mockResolvedValue(undefined),
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new PetAdminFeatureService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, redis };
}

describe('PetAdminFeatureService', () => {
  describe('getPets', () => {
    it('returns a paginated list with owner and statistics', async () => {
      const { service, db } = setup();
      const pet = buildPet();

      db.pet.count.mockResolvedValue(11);
      db.pet.findMany.mockResolvedValue([pet]);

      const result = await service.getPets({
        page: 1,
        limit: 5,
        minLevel: 2,
        maxLevel: 10,
      });

      expect(result.pagination).toEqual({
        page: 1,
        limit: 5,
        total: 11,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      });
      expect(result.pets).toHaveLength(1);
      expect(result.pets[0]).toMatchObject({
        id: PET_ID,
        name: 'Барсик',
        owner: {
          id: USER_ID,
          nickname: 'Тест',
          role: 'PLAYER',
          roleLabel: 'Игрок',
          isBlocked: false,
        },
      });
      expect(result.pets[0].statistics?.coins).toBe('100');
      expect(db.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { level: { gte: 2, lte: 10 } },
          skip: 0,
          take: 5,
        }),
      );
    });

    it('searches by pet name or owner nickname', async () => {
      const { service, db } = setup();

      db.pet.count.mockResolvedValue(0);
      db.pet.findMany.mockResolvedValue([]);

      await service.getPets({ search: ' бар ' });

      expect(db.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'бар', mode: 'insensitive' } },
              {
                user: {
                  nickname: { contains: 'бар', mode: 'insensitive' },
                },
              },
            ],
          },
        }),
      );
    });
  });

  describe('getPetById', () => {
    it('throws when the pet does not exist', async () => {
      const { service, db } = setup();

      db.pet.findUnique.mockResolvedValue(null);

      await expect(service.getPetById(PET_ID)).rejects.toThrow(
        new NotFoundException(PET_MESSAGES.PET_NOT_FOUND),
      );
    });
  });

  describe('updatePet', () => {
    it('updates pet fields and invalidates the owner cache', async () => {
      const { service, db, redis } = setup();
      const pet = buildPet();

      db.pet.findUnique.mockResolvedValue(pet);
      db.pet.update.mockResolvedValue(pet);

      await service.updatePet(PET_ID, {
        name: 'Мурзик',
        level: 5,
        xp: 10,
        hunger: 50,
        mood: 70,
      });

      expect(db.pet.update).toHaveBeenCalledWith({
        where: { id: PET_ID },
        data: {
          name: 'Мурзик',
          level: 5,
          xp: 10,
          hunger: 50,
          mood: 70,
          lastHungerAt: expect.any(Date),
          lastMoodAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });
  });

  describe('updateStatistics', () => {
    it('updates owner statistics with bigint fields', async () => {
      const { service, db, redis } = setup();
      const pet = buildPet();

      db.pet.findUnique.mockResolvedValue(pet);
      db.playerStatistic.update.mockResolvedValue(buildStats());

      await service.updateStatistics(PET_ID, {
        coins: 500,
        totalCoinsEarned: 900,
        totalClicks: 40,
        totalFeeds: 6,
        streak: 3,
        clickPower: 4,
        autoIncome: 2,
      });

      expect(db.playerStatistic.update).toHaveBeenCalledWith({
        where: { playerId: USER_ID },
        data: {
          coins: 500n,
          totalCoinsEarned: 900n,
          totalClicks: 40n,
          totalFeeds: 6n,
          streak: 3,
          clickPower: 4,
          autoIncome: 2,
          lastSyncAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });
  });
});
