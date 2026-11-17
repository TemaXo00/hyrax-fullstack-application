import { ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { COSMETIC_MESSAGES } from '@org/validation-messages';

import { CosmeticAdminService } from './cosmetic-admin.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const COSMETIC_ID = 'cosmetic-1';

interface CosmeticRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  slot: 'HAT' | 'BACKGROUND' | 'ACCESSORY';
  rarity: 'COMMON' | 'RARE' | 'EPIC';
  createdAt: Date;
  updatedAt: Date;
}

function buildCosmetic(
  overrides: Partial<CosmeticRecord> = {},
): CosmeticRecord {
  return {
    id: COSMETIC_ID,
    name: 'Цилиндр',
    description: null,
    price: 250,
    imageUrl: null,
    isActive: true,
    slot: 'HAT',
    rarity: 'RARE',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function setup(): {
  service: CosmeticAdminService;
  db: {
    cosmetic: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    cosmeticInventory: { count: jest.Mock };
    dailyRewardConfig: { count: jest.Mock };
  };
  redis: { delByPrefix: jest.Mock };
} {
  const db = {
    cosmetic: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cosmeticInventory: {
      count: jest.fn(),
    },
    dailyRewardConfig: {
      count: jest.fn(),
    },
  };
  const redis = {
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new CosmeticAdminService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, redis };
}

describe('CosmeticAdminService', () => {
  it('returns all cosmetics including inactive ones', async () => {
    const { service, db } = setup();

    db.cosmetic.count.mockResolvedValue(1);
    db.cosmetic.findMany.mockResolvedValue([
      buildCosmetic({ isActive: false }),
    ]);

    const result = await service.getCosmetics({ page: 1, limit: 10 });

    expect(result.cosmetics[0].isActive).toBe(false);
  });

  it('throws when cosmetic is missing', async () => {
    const { service, db } = setup();

    db.cosmetic.findUnique.mockResolvedValue(null);

    await expect(service.getCosmeticById(COSMETIC_ID)).rejects.toThrow(
      new NotFoundException(COSMETIC_MESSAGES.NOT_FOUND),
    );
  });

  it('creates cosmetic', async () => {
    const { service, db } = setup();
    const cosmetic = buildCosmetic();

    db.cosmetic.create.mockResolvedValue(cosmetic);

    const result = await service.createCosmetic({
      name: cosmetic.name,
      price: cosmetic.price,
      slot: cosmetic.slot,
      rarity: cosmetic.rarity,
    });

    expect(db.cosmetic.create).toHaveBeenCalledWith({
      data: {
        name: cosmetic.name,
        description: undefined,
        price: cosmetic.price,
        imageUrl: undefined,
        slot: cosmetic.slot,
        rarity: cosmetic.rarity,
      },
    });
    expect(result.slotLabel).toBe('Головной убор');
  });

  it('updates cosmetic and invalidates me caches', async () => {
    const { service, db, redis } = setup();
    const cosmetic = buildCosmetic();

    db.cosmetic.findUnique.mockResolvedValue(cosmetic);
    db.cosmetic.update.mockResolvedValue({ ...cosmetic, price: 300 });

    const result = await service.updateCosmetic(COSMETIC_ID, { price: 300 });

    expect(db.cosmetic.update).toHaveBeenCalledWith({
      where: { id: COSMETIC_ID },
      data: { price: 300 },
    });
    expect(result.price).toBe(300);
    expect(redis.delByPrefix).toHaveBeenCalledWith(CACHE_KEYS.mePrefix());
  });

  it('rejects deletion while cosmetic is in inventories', async () => {
    const { service, db } = setup();

    db.cosmetic.findUnique.mockResolvedValue(buildCosmetic());
    db.cosmeticInventory.count.mockResolvedValue(2);
    db.dailyRewardConfig.count.mockResolvedValue(0);

    await expect(service.deleteCosmetic(COSMETIC_ID)).rejects.toThrow(
      new ConflictException(COSMETIC_MESSAGES.DELETE_CONFLICT),
    );
    expect(db.cosmetic.delete).not.toHaveBeenCalled();
  });

  it('rejects deletion while cosmetic is used in daily rewards', async () => {
    const { service, db } = setup();

    db.cosmetic.findUnique.mockResolvedValue(buildCosmetic());
    db.cosmeticInventory.count.mockResolvedValue(0);
    db.dailyRewardConfig.count.mockResolvedValue(1);

    await expect(service.deleteCosmetic(COSMETIC_ID)).rejects.toThrow(
      new ConflictException(COSMETIC_MESSAGES.DELETE_CONFLICT),
    );
  });

  it('deletes unused cosmetic and invalidates me caches', async () => {
    const { service, db, redis } = setup();

    db.cosmetic.findUnique.mockResolvedValue(buildCosmetic());
    db.cosmeticInventory.count.mockResolvedValue(0);
    db.dailyRewardConfig.count.mockResolvedValue(0);

    await service.deleteCosmetic(COSMETIC_ID);

    expect(db.cosmetic.delete).toHaveBeenCalledWith({
      where: { id: COSMETIC_ID },
    });
    expect(redis.delByPrefix).toHaveBeenCalledWith(CACHE_KEYS.mePrefix());
  });
});
