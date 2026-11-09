import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import {
  FOOD_MESSAGES,
  PET_MESSAGES,
  SHOP_MESSAGES,
} from '@org/validation-messages';

import { FoodShopService } from './food-shop.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';

interface FoodRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  hungerRestore: number;
  moodBonus: number;
  createdAt: Date;
  updatedAt: Date;
}

function buildFood(overrides: Partial<FoodRecord> = {}): FoodRecord {
  return {
    id: 'food-1',
    name: 'Яблоко',
    description: 'Сочное яблоко',
    price: 25,
    imageUrl: null,
    isActive: true,
    hungerRestore: 30,
    moodBonus: 5,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function createTx(): {
  food: { findUnique: jest.Mock };
  playerStatistic: { findUnique: jest.Mock; update: jest.Mock };
  foodInventory: { upsert: jest.Mock };
} {
  return {
    food: {
      findUnique: jest.fn(),
    },
    playerStatistic: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    foodInventory: {
      upsert: jest.fn(),
    },
  };
}

function setup(): {
  service: FoodShopService;
  db: {
    food: { count: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  tx: ReturnType<typeof createTx>;
  redis: { del: jest.Mock };
} {
  const tx = createTx();
  const db = {
    food: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) =>
        await callback(tx),
    ),
  };
  const redis = {
    del: jest.fn().mockResolvedValue(undefined),
  };
  const service = new FoodShopService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, tx, redis };
}

describe('FoodShopService', () => {
  describe('getFoods', () => {
    it('returns a paginated food catalog', async () => {
      const { service, db } = setup();

      db.food.count.mockResolvedValue(12);
      db.food.findMany.mockResolvedValue([buildFood()]);

      const result = await service.getFoods({ page: 1, limit: 5 });

      expect(result.pagination).toEqual({
        page: 1,
        limit: 5,
        total: 12,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      });
      expect(result.foods).toHaveLength(1);
      expect(result.foods[0].name).toBe('Яблоко');
      expect(db.food.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { price: 'asc' },
        skip: 0,
        take: 5,
      });
    });

    it('applies a case-insensitive search filter', async () => {
      const { service, db } = setup();

      db.food.count.mockResolvedValue(0);
      db.food.findMany.mockResolvedValue([]);

      await service.getFoods({ page: 2, limit: 10, search: ' яб ' });

      expect(db.food.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            name: { contains: 'яб', mode: 'insensitive' },
          },
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('buyFood', () => {
    it('withdraws coins and adds food to the inventory', async () => {
      const { service, tx, redis } = setup();
      const food = buildFood();

      tx.food.findUnique.mockResolvedValue(food);
      tx.playerStatistic.findUnique.mockResolvedValue({
        id: 'stats-1',
        coins: 100n,
      });
      tx.playerStatistic.update.mockResolvedValue({
        id: 'stats-1',
        coins: 25n,
      });
      tx.foodInventory.upsert.mockResolvedValue({
        id: 'inventory-1',
        quantity: 3,
        food,
        createdAt: NOW,
        updatedAt: NOW,
      });

      const result = await service.buyFood(USER_ID, {
        foodId: food.id,
        quantity: 3,
      });

      expect(tx.playerStatistic.update).toHaveBeenCalledWith({
        where: { id: 'stats-1' },
        data: { coins: { decrement: 75n } },
      });
      expect(tx.foodInventory.upsert).toHaveBeenCalledWith({
        where: { foodId_userId: { foodId: food.id, userId: USER_ID } },
        create: { foodId: food.id, userId: USER_ID, quantity: 3 },
        update: { quantity: { increment: 3 } },
        include: { food: true },
      });
      expect(result.spentCoins).toBe('75');
      expect(result.coinsBalance).toBe('25');
      expect(result.inventory.quantity).toBe(3);
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });

    it('throws when the food does not exist', async () => {
      const { service, tx } = setup();

      tx.food.findUnique.mockResolvedValue(null);

      await expect(
        service.buyFood(USER_ID, { foodId: 'missing', quantity: 1 }),
      ).rejects.toThrow(FOOD_MESSAGES.NOT_FOUND);
    });

    it('throws when the food is inactive', async () => {
      const { service, tx } = setup();

      tx.food.findUnique.mockResolvedValue(buildFood({ isActive: false }));

      await expect(
        service.buyFood(USER_ID, { foodId: 'food-1', quantity: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when the player statistics are missing', async () => {
      const { service, tx } = setup();

      tx.food.findUnique.mockResolvedValue(buildFood());
      tx.playerStatistic.findUnique.mockResolvedValue(null);

      await expect(
        service.buyFood(USER_ID, { foodId: 'food-1', quantity: 1 }),
      ).rejects.toThrow(PET_MESSAGES.STATISTICS_NOT_FOUND);
    });

    it('throws when there are not enough coins', async () => {
      const { service, tx } = setup();

      tx.food.findUnique.mockResolvedValue(buildFood());
      tx.playerStatistic.findUnique.mockResolvedValue({
        id: 'stats-1',
        coins: 10n,
      });

      await expect(
        service.buyFood(USER_ID, { foodId: 'food-1', quantity: 1 }),
      ).rejects.toThrow(SHOP_MESSAGES.INSUFFICIENT_COINS(25, '10'));
      expect(tx.playerStatistic.update).not.toHaveBeenCalled();
    });
  });

  it('throws NotFoundException when the user statistics are missing', async () => {
    const { service, tx } = setup();

    tx.food.findUnique.mockResolvedValue(buildFood());
    tx.playerStatistic.findUnique.mockResolvedValue(null);

    await expect(
      service.buyFood(USER_ID, { foodId: 'food-1', quantity: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
