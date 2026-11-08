import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { PET_MESSAGES } from '@org/validation-messages';

import { PetFeatureService } from './pet-feature.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';

interface PetRecord {
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
}

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

interface UserView {
  id: string;
  nickname: string;
  pet: PetRecord | null;
  stats: StatsRecord | null;
  foodInventories: unknown[];
  cosmeticInventories: unknown[];
  userUpgrades: unknown[];
}

function buildPet(overrides: Partial<PetRecord> = {}): PetRecord {
  return {
    id: 'pet-1',
    name: 'Питомец Тест',
    level: 1,
    xp: 0,
    hunger: 100,
    mood: 100,
    lastMoodAt: NOW,
    lastHungerAt: NOW,
    lastWalkAt: null,
    userId: USER_ID,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildStats(overrides: Partial<StatsRecord> = {}): StatsRecord {
  return {
    id: 'stats-1',
    coins: 0n,
    totalCoinsEarned: 0n,
    totalClicks: 0n,
    totalFeeds: 0n,
    streak: 0,
    clickPower: 1,
    autoIncome: 0,
    lastSyncAt: NOW,
    playerId: USER_ID,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildUser(
  pet: PetRecord | null = buildPet(),
  stats: StatsRecord | null = buildStats(),
): UserView {
  return {
    id: USER_ID,
    nickname: 'Тест',
    pet,
    stats,
    foodInventories: [],
    cosmeticInventories: [],
    userUpgrades: [],
  };
}

function createTx(): {
  user: { findUnique: jest.Mock };
  pet: { create: jest.Mock; update: jest.Mock };
  playerStatistic: { create: jest.Mock; update: jest.Mock };
  foodInventory: { findUnique: jest.Mock; update: jest.Mock };
} {
  return {
    user: {
      findUnique: jest.fn(),
    },
    pet: {
      create: jest.fn(),
      update: jest.fn(),
    },
    playerStatistic: {
      create: jest.fn(),
      update: jest.fn(),
    },
    foodInventory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function setup(): {
  service: PetFeatureService;
  tx: ReturnType<typeof createTx>;
  db: { $transaction: jest.Mock };
  redis: { del: jest.Mock };
} {
  const tx = createTx();
  const db = {
    $transaction: jest.fn(
      async (
        callback: ((client: typeof tx) => Promise<unknown>) | Promise<unknown>,
      ) =>
        typeof callback === 'function' ? await callback(tx) : await callback,
    ),
  };
  const redis = {
    del: jest.fn().mockResolvedValue(undefined),
  };
  const service = new PetFeatureService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, tx, db, redis };
}

describe('PetFeatureService', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getState', () => {
    it('returns the mapped pet state with decay information', async () => {
      const { service, tx, redis } = setup();
      const pet = buildPet();

      tx.user.findUnique
        .mockResolvedValueOnce(buildUser(pet))
        .mockResolvedValueOnce(buildUser(pet));

      const state = await service.getState(USER_ID);

      expect(state.pet.mood).toBe(100);
      expect(state.pet.moodStatus).toBe('HAPPY');
      expect(state.decay.moodPerHour).toBeCloseTo(100 / 6, 2);
      expect(state.decay.hungerPerHour).toBeCloseTo(100 / 12, 2);
      expect(state.autoIncomeCollected).toBe('0');
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('applies mood decay and invalidates the me cache when values change', async () => {
      const { service, tx, redis } = setup();
      const decayed = buildPet({
        mood: 100,
        lastMoodAt: new Date(NOW.getTime() - 3 * 60 * 60 * 1000),
      });

      tx.user.findUnique
        .mockResolvedValueOnce(buildUser(decayed))
        .mockResolvedValueOnce(buildUser({ ...decayed, mood: 50 }));
      tx.pet.update.mockImplementation(async ({ data }: { data: object }) => ({
        ...decayed,
        ...data,
      }));

      const state = await service.getState(USER_ID);

      expect(state.pet.mood).toBe(50);
      expect(tx.pet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mood: 50 }),
        }),
      );
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });

    it('collects passive income based on elapsed minutes', async () => {
      const { service, tx, redis } = setup();
      const pet = buildPet();
      const stats = buildStats({
        autoIncome: 2,
        lastSyncAt: new Date(NOW.getTime() - 30 * 60 * 1000),
      });

      tx.user.findUnique
        .mockResolvedValueOnce(buildUser(pet, stats))
        .mockResolvedValueOnce(
          buildUser(pet, { ...stats, coins: 60n, totalCoinsEarned: 60n }),
        );
      tx.playerStatistic.update.mockResolvedValue({
        ...stats,
        coins: 60n,
        totalCoinsEarned: 60n,
        lastSyncAt: NOW,
      });

      const state = await service.getState(USER_ID);

      expect(state.autoIncomeCollected).toBe('60');
      expect(state.stats.coins).toBe('60');
      expect(tx.playerStatistic.update).toHaveBeenCalledWith({
        where: { id: stats.id },
        data: {
          coins: { increment: 60n },
          totalCoinsEarned: { increment: 60n },
          lastSyncAt: NOW,
        },
      });
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });

    it('throws when the user does not exist', async () => {
      const { service, tx } = setup();

      tx.user.findUnique.mockResolvedValue(null);

      await expect(service.getState(USER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('rename', () => {
    it('renames the pet and invalidates the me cache', async () => {
      const { service, tx, redis } = setup();
      const pet = buildPet();

      tx.user.findUnique.mockResolvedValue(buildUser(pet));
      tx.pet.update.mockResolvedValue({ ...pet, name: 'Новое имя' });

      const result = await service.rename(USER_ID, { name: 'Новое имя' });

      expect(result.name).toBe('Новое имя');
      expect(tx.pet.update).toHaveBeenCalledWith({
        where: { id: pet.id },
        data: { name: 'Новое имя', updatedAt: NOW },
      });
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });
  });

  describe('click', () => {
    it('awards click power scaled by mood', async () => {
      const { service, tx, redis } = setup();
      const pet = buildPet({ mood: 100 });
      const stats = buildStats({ clickPower: 10, coins: 5n });

      tx.user.findUnique.mockResolvedValue(buildUser(pet, stats));
      tx.pet.update.mockResolvedValue(pet);
      tx.playerStatistic.update.mockResolvedValue({
        ...stats,
        coins: 15n,
        totalCoinsEarned: 10n,
        totalClicks: 1n,
      });

      const result = await service.click(USER_ID);

      expect(result.coinsEarned).toBe('10');
      expect(result.coinsBalance).toBe('15');
      expect(result.totalClicks).toBe('1');
      expect(result.action).toBe('CLICK');
      expect(result.actionLabel).toBe('Клик по питомцу');
      expect(tx.playerStatistic.update).toHaveBeenCalledWith({
        where: { id: stats.id },
        data: {
          coins: { increment: 10n },
          totalCoinsEarned: { increment: 10n },
          totalClicks: { increment: 1n },
        },
      });
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });

    it('reduces the reward for a sad pet and never drops below one coin', async () => {
      const { service, tx } = setup();
      const pet = buildPet({ mood: 0 });
      const stats = buildStats({ clickPower: 1 });

      tx.user.findUnique.mockResolvedValue(buildUser(pet, stats));
      tx.pet.update.mockResolvedValue(pet);
      tx.playerStatistic.update.mockResolvedValue({
        ...stats,
        coins: 1n,
        totalCoinsEarned: 1n,
        totalClicks: 1n,
      });

      const result = await service.click(USER_ID);

      expect(result.coinsEarned).toBe('1');
    });

    it('levels up the pet when enough xp is collected', async () => {
      const { service, tx } = setup();
      const pet = buildPet({ level: 1, xp: 98 });
      const stats = buildStats({ clickPower: 1 });

      tx.user.findUnique.mockResolvedValue(buildUser(pet, stats));
      tx.pet.update.mockResolvedValue({ ...pet, level: 2, xp: 0 });
      tx.playerStatistic.update.mockResolvedValue(stats);

      const result = await service.click(USER_ID);

      expect(result.leveledUp).toBe(true);
      expect(result.levelsGained).toBe(1);
      expect(result.pet.level).toBe(2);
      expect(result.pet.xp).toBe(0);
    });

    it('creates a pet and statistics for a user without them', async () => {
      const { service, tx } = setup();
      const pet = buildPet();
      const stats = buildStats();

      tx.user.findUnique.mockResolvedValue(buildUser(null, null));
      tx.pet.create.mockResolvedValue(pet);
      tx.playerStatistic.create.mockResolvedValue(stats);
      tx.pet.update.mockResolvedValue(pet);
      tx.playerStatistic.update.mockResolvedValue({
        ...stats,
        coins: 1n,
        totalCoinsEarned: 1n,
        totalClicks: 1n,
      });

      const result = await service.click(USER_ID);

      expect(tx.pet.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          name: 'Питомец Тест',
          updatedAt: NOW,
        },
      });
      expect(tx.playerStatistic.create).toHaveBeenCalledWith({
        data: { playerId: USER_ID },
      });
      expect(result.coinsEarned).toBe('1');
    });
  });

  describe('walk', () => {
    it('awards a multiplied reward and updates mood, hunger and cooldown', async () => {
      const { service, tx } = setup();
      const pet = buildPet({ mood: 90, hunger: 40 });
      const stats = buildStats({ clickPower: 10 });

      tx.user.findUnique.mockResolvedValue(buildUser(pet, stats));
      tx.pet.update.mockImplementation(async ({ data }: { data: object }) => ({
        ...pet,
        ...data,
      }));
      tx.playerStatistic.update.mockResolvedValue({
        ...stats,
        coins: 50n,
        totalCoinsEarned: 50n,
      });

      const result = await service.walk(USER_ID);

      expect(result.coinsEarned).toBe('45');
      expect(result.action).toBe('WALK');
      expect(result.pet.mood).toBe(100);
      expect(result.pet.hunger).toBe(35);
      expect(tx.pet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mood: 100,
            hunger: 35,
            lastWalkAt: NOW,
            lastMoodAt: NOW,
            lastHungerAt: NOW,
          }),
        }),
      );
    });

    it('rejects a walk while the cooldown is active', async () => {
      const { service, tx } = setup();
      const pet = buildPet({
        lastWalkAt: new Date(NOW.getTime() - 30_000),
      });

      tx.user.findUnique.mockResolvedValue(buildUser(pet));

      await expect(service.walk(USER_ID)).rejects.toThrow(
        PET_MESSAGES.WALK_COOLDOWN(30),
      );
      expect(tx.playerStatistic.update).not.toHaveBeenCalled();
    });

    it('clamps hunger at zero', async () => {
      const { service, tx } = setup();
      const pet = buildPet({ mood: 100, hunger: 3 });
      const stats = buildStats({ clickPower: 1 });

      tx.user.findUnique.mockResolvedValue(buildUser(pet, stats));
      tx.pet.update.mockImplementation(async ({ data }: { data: object }) => ({
        ...pet,
        ...data,
      }));
      tx.playerStatistic.update.mockResolvedValue(stats);

      const result = await service.walk(USER_ID);

      expect(result.pet.hunger).toBe(0);
    });
  });

  describe('feed', () => {
    it('consumes one unit of food and restores pet stats', async () => {
      const { service, tx, redis } = setup();
      const pet = buildPet({ mood: 40, hunger: 30 });
      const stats = buildStats({ totalFeeds: 2n });
      const food = {
        id: 'food-1',
        name: 'Яблоко',
        description: null,
        price: 25,
        imageUrl: null,
        isActive: true,
        hungerRestore: 30,
        moodBonus: 5,
        createdAt: NOW,
        updatedAt: NOW,
      };

      tx.user.findUnique.mockResolvedValue(buildUser(pet, stats));
      tx.foodInventory.findUnique.mockResolvedValue({
        id: 'inventory-1',
        quantity: 2,
        food,
        createdAt: NOW,
        updatedAt: NOW,
      });
      tx.pet.update.mockImplementation(async ({ data }: { data: object }) => ({
        ...pet,
        ...data,
      }));
      tx.playerStatistic.update.mockResolvedValue({
        ...stats,
        totalFeeds: 3n,
      });

      const result = await service.feed(USER_ID, { foodId: food.id });

      expect(tx.foodInventory.update).toHaveBeenCalledWith({
        where: { id: 'inventory-1' },
        data: { quantity: { decrement: 1 } },
      });
      expect(result.pet.mood).toBe(45);
      expect(result.pet.hunger).toBe(60);
      expect(result.totalFeeds).toBe('3');
      expect(result.xpEarned).toBe(5);
      expect(result.action).toBe('FEED');
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });

    it('rejects feeding with food that is not in the inventory', async () => {
      const { service, tx } = setup();

      tx.user.findUnique.mockResolvedValue(buildUser());
      tx.foodInventory.findUnique.mockResolvedValue(null);

      await expect(
        service.feed(USER_ID, { foodId: 'missing' }),
      ).rejects.toThrow(PET_MESSAGES.STORED_FOOD_NOT_FOUND);
    });

    it('rejects feeding with an empty food stack', async () => {
      const { service, tx } = setup();

      tx.user.findUnique.mockResolvedValue(buildUser());
      tx.foodInventory.findUnique.mockResolvedValue({
        id: 'inventory-1',
        quantity: 0,
        food: { hungerRestore: 10, moodBonus: 1 },
        createdAt: NOW,
        updatedAt: NOW,
      });

      await expect(
        service.feed(USER_ID, { foodId: 'food-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
