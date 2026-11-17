import { ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { FOOD_MESSAGES } from '@org/validation-messages';

import { FoodAdminService } from './food-admin.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const FOOD_ID = 'food-1';

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
    id: FOOD_ID,
    name: 'Морковка',
    description: null,
    price: 10,
    imageUrl: null,
    isActive: false,
    hungerRestore: 15,
    moodBonus: 5,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function setup(): {
  service: FoodAdminService;
  db: {
    food: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    foodInventory: { count: jest.Mock };
  };
  redis: { delByPrefix: jest.Mock };
} {
  const db = {
    food: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    foodInventory: {
      count: jest.fn(),
    },
  };
  const redis = {
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new FoodAdminService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, redis };
}

describe('FoodAdminService', () => {
  it('returns all foods including inactive ones', async () => {
    const { service, db } = setup();

    db.food.count.mockResolvedValue(1);
    db.food.findMany.mockResolvedValue([buildFood()]);

    const result = await service.getFoods({ page: 1, limit: 10 });

    expect(result.foods[0].isActive).toBe(false);
    expect(db.food.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('applies a case-insensitive name search', async () => {
    const { service, db } = setup();

    db.food.count.mockResolvedValue(0);
    db.food.findMany.mockResolvedValue([]);

    await service.getFoods({ search: ' мор ' });

    expect(db.food.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { contains: 'мор', mode: 'insensitive' } },
      }),
    );
  });

  it('throws when food is missing', async () => {
    const { service, db } = setup();

    db.food.findUnique.mockResolvedValue(null);

    await expect(service.getFoodById(FOOD_ID)).rejects.toThrow(
      new NotFoundException(FOOD_MESSAGES.NOT_FOUND),
    );
  });

  it('creates food', async () => {
    const { service, db } = setup();
    const food = buildFood();

    db.food.create.mockResolvedValue(food);

    const result = await service.createFood({
      name: food.name,
      price: food.price,
      hungerRestore: food.hungerRestore,
      moodBonus: food.moodBonus,
    });

    expect(db.food.create).toHaveBeenCalledWith({
      data: {
        name: food.name,
        description: undefined,
        price: food.price,
        imageUrl: undefined,
        hungerRestore: food.hungerRestore,
        moodBonus: food.moodBonus,
      },
    });
    expect(result.id).toBe(FOOD_ID);
  });

  it('updates food and invalidates me caches', async () => {
    const { service, db, redis } = setup();
    const food = buildFood();

    db.food.findUnique.mockResolvedValue(food);
    db.food.update.mockResolvedValue({ ...food, price: 20 });

    const result = await service.updateFood(FOOD_ID, { price: 20 });

    expect(db.food.update).toHaveBeenCalledWith({
      where: { id: FOOD_ID },
      data: { price: 20 },
    });
    expect(result.price).toBe(20);
    expect(redis.delByPrefix).toHaveBeenCalledWith(CACHE_KEYS.mePrefix());
  });

  it('rejects deletion while food is in inventories', async () => {
    const { service, db, redis } = setup();

    db.food.findUnique.mockResolvedValue(buildFood());
    db.foodInventory.count.mockResolvedValue(1);

    await expect(service.deleteFood(FOOD_ID)).rejects.toThrow(
      new ConflictException(FOOD_MESSAGES.DELETE_CONFLICT),
    );
    expect(db.food.delete).not.toHaveBeenCalled();
    expect(redis.delByPrefix).not.toHaveBeenCalled();
  });

  it('deletes unused food and invalidates me caches', async () => {
    const { service, db, redis } = setup();

    db.food.findUnique.mockResolvedValue(buildFood());
    db.foodInventory.count.mockResolvedValue(0);

    await service.deleteFood(FOOD_ID);

    expect(db.food.delete).toHaveBeenCalledWith({ where: { id: FOOD_ID } });
    expect(redis.delByPrefix).toHaveBeenCalledWith(CACHE_KEYS.mePrefix());
  });
});
