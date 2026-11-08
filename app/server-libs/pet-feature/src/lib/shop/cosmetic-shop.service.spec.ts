import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import {
  COSMETIC_MESSAGES,
  PET_MESSAGES,
  SHOP_MESSAGES,
} from '@org/validation-messages';

import { CosmeticShopService } from './cosmetic-shop.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';

interface CosmeticRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  slot: string;
  rarity: string;
  createdAt: Date;
  updatedAt: Date;
}

function buildCosmetic(
  overrides: Partial<CosmeticRecord> = {},
): CosmeticRecord {
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
    ...overrides,
  };
}

function createTx(): {
  cosmetic: { findUnique: jest.Mock };
  cosmeticInventory: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  playerStatistic: { findUnique: jest.Mock; update: jest.Mock };
} {
  return {
    cosmetic: {
      findUnique: jest.fn(),
    },
    cosmeticInventory: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    playerStatistic: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function setup(): {
  service: CosmeticShopService;
  db: {
    cosmetic: { count: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  tx: ReturnType<typeof createTx>;
  redis: { del: jest.Mock };
} {
  const tx = createTx();
  const db = {
    cosmetic: {
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
  const service = new CosmeticShopService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, tx, redis };
}

describe('CosmeticShopService', () => {
  describe('getCosmetics', () => {
    it('maps the catalog including Russian labels', async () => {
      const { service, db } = setup();

      db.cosmetic.count.mockResolvedValue(1);
      db.cosmetic.findMany.mockResolvedValue([buildCosmetic()]);

      const result = await service.getCosmetics({ page: 1, limit: 10 });

      expect(result.cosmetics).toHaveLength(1);
      expect(result.cosmetics[0].slotLabel).toBe('Головной убор');
      expect(result.cosmetics[0].rarityLabel).toBe('Обычная');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
    });
  });

  describe('buyCosmetic', () => {
    it('withdraws coins and stores the cosmetic', async () => {
      const { service, tx, redis } = setup();
      const cosmetic = buildCosmetic();

      tx.cosmetic.findUnique.mockResolvedValue(cosmetic);
      tx.cosmeticInventory.findUnique.mockResolvedValue(null);
      tx.playerStatistic.findUnique.mockResolvedValue({
        id: 'stats-1',
        coins: 250n,
      });
      tx.playerStatistic.update.mockResolvedValue({
        id: 'stats-1',
        coins: 150n,
      });
      tx.cosmeticInventory.create.mockResolvedValue({
        id: 'inventory-1',
        isEquipped: false,
        cosmetic,
        createdAt: NOW,
        updatedAt: NOW,
      });

      const result = await service.buyCosmetic(USER_ID, cosmetic.id);

      expect(tx.playerStatistic.update).toHaveBeenCalledWith({
        where: { id: 'stats-1' },
        data: { coins: { decrement: 100n } },
      });
      expect(tx.cosmeticInventory.create).toHaveBeenCalledWith({
        data: { cosmeticId: cosmetic.id, userId: USER_ID },
        include: { cosmetic: true },
      });
      expect(result.spentCoins).toBe('100');
      expect(result.coinsBalance).toBe('150');
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });

    it('throws when the cosmetic was already purchased', async () => {
      const { service, tx } = setup();

      tx.cosmetic.findUnique.mockResolvedValue(buildCosmetic());
      tx.cosmeticInventory.findUnique.mockResolvedValue({
        id: 'inventory-1',
      });

      await expect(service.buyCosmetic(USER_ID, 'cosmetic-1')).rejects.toThrow(
        COSMETIC_MESSAGES.ALREADY_OWNED,
      );
    });

    it('throws when the cosmetic does not exist', async () => {
      const { service, tx } = setup();

      tx.cosmetic.findUnique.mockResolvedValue(null);

      await expect(
        service.buyCosmetic(USER_ID, 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when the cosmetic is inactive', async () => {
      const { service, tx } = setup();

      tx.cosmetic.findUnique.mockResolvedValue(
        buildCosmetic({ isActive: false }),
      );

      await expect(
        service.buyCosmetic(USER_ID, 'cosmetic-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when the statistics are missing', async () => {
      const { service, tx } = setup();

      tx.cosmetic.findUnique.mockResolvedValue(buildCosmetic());
      tx.cosmeticInventory.findUnique.mockResolvedValue(null);
      tx.playerStatistic.findUnique.mockResolvedValue(null);

      await expect(service.buyCosmetic(USER_ID, 'cosmetic-1')).rejects.toThrow(
        PET_MESSAGES.STATISTICS_NOT_FOUND,
      );
    });

    it('throws when there are not enough coins', async () => {
      const { service, tx } = setup();

      tx.cosmetic.findUnique.mockResolvedValue(buildCosmetic());
      tx.cosmeticInventory.findUnique.mockResolvedValue(null);
      tx.playerStatistic.findUnique.mockResolvedValue({
        id: 'stats-1',
        coins: 50n,
      });

      await expect(service.buyCosmetic(USER_ID, 'cosmetic-1')).rejects.toThrow(
        SHOP_MESSAGES.INSUFFICIENT_COINS(100, '50'),
      );
    });
  });

  describe('equipCosmetic', () => {
    it('unequips other items in the same slot before equipping', async () => {
      const { service, tx, redis } = setup();
      const cosmetic = buildCosmetic({ slot: 'HAT' });

      tx.cosmeticInventory.findUnique.mockResolvedValue({
        id: 'inventory-1',
        isEquipped: false,
        cosmetic,
        createdAt: NOW,
        updatedAt: NOW,
      });
      tx.cosmeticInventory.update.mockResolvedValue({
        id: 'inventory-1',
        isEquipped: true,
        cosmetic,
        createdAt: NOW,
        updatedAt: NOW,
      });

      const result = await service.equipCosmetic(USER_ID, cosmetic.id, {
        equipped: true,
      });

      expect(tx.cosmeticInventory.updateMany).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          cosmetic: { slot: 'HAT' },
          NOT: { id: 'inventory-1' },
        },
        data: { isEquipped: false },
      });
      expect(tx.cosmeticInventory.update).toHaveBeenCalledWith({
        where: { id: 'inventory-1' },
        data: { isEquipped: true },
        include: { cosmetic: true },
      });
      expect(result.isEquipped).toBe(true);
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });

    it('does not unequip other items when removing the item', async () => {
      const { service, tx } = setup();
      const cosmetic = buildCosmetic();

      tx.cosmeticInventory.findUnique.mockResolvedValue({
        id: 'inventory-1',
        isEquipped: true,
        cosmetic,
        createdAt: NOW,
        updatedAt: NOW,
      });
      tx.cosmeticInventory.update.mockResolvedValue({
        id: 'inventory-1',
        isEquipped: false,
        cosmetic,
        createdAt: NOW,
        updatedAt: NOW,
      });

      await service.equipCosmetic(USER_ID, cosmetic.id, {
        equipped: false,
      });

      expect(tx.cosmeticInventory.updateMany).not.toHaveBeenCalled();
    });

    it('throws when the cosmetic is not owned', async () => {
      const { service, tx } = setup();

      tx.cosmeticInventory.findUnique.mockResolvedValue(null);

      await expect(
        service.equipCosmetic(USER_ID, 'cosmetic-1', { equipped: true }),
      ).rejects.toThrow(COSMETIC_MESSAGES.NOT_OWNED);
    });
  });
});
