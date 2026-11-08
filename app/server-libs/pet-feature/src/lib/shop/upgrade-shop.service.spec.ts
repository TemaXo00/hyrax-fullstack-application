import { NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import {
  PET_MESSAGES,
  SHOP_MESSAGES,
  UPGRADE_MESSAGES,
} from '@org/validation-messages';

import { UpgradeShopService } from './upgrade-shop.service';
import { calculateUpgradePrice } from '../game/pet-game.rules';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';

interface UpgradeRecord {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  effectType: string;
  effectValue: number;
  basePrice: number;
  priceMultiplier: number;
  maxLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

function buildUpgrade(overrides: Partial<UpgradeRecord> = {}): UpgradeRecord {
  return {
    id: 'upgrade-1',
    name: 'Крепкая лапа',
    description: 'Увеличивает силу клика',
    imageUrl: null,
    effectType: 'CLICK_POWER',
    effectValue: 1,
    basePrice: 100,
    priceMultiplier: 1.5,
    maxLevel: 5,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function createTx(): {
  upgrade: { findUnique: jest.Mock };
  userUpgrade: { findUnique: jest.Mock; upsert: jest.Mock };
  playerStatistic: { findUnique: jest.Mock; update: jest.Mock };
} {
  return {
    upgrade: {
      findUnique: jest.fn(),
    },
    userUpgrade: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    playerStatistic: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function setup(): {
  service: UpgradeShopService;
  db: {
    upgrade: { count: jest.Mock; findMany: jest.Mock };
    userUpgrade: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  tx: ReturnType<typeof createTx>;
  redis: { del: jest.Mock };
} {
  const tx = createTx();
  const db = {
    upgrade: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    userUpgrade: {
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
  const service = new UpgradeShopService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, tx, redis };
}

describe('UpgradeShopService', () => {
  describe('getUpgrades', () => {
    it('returns owned levels and the next level price', async () => {
      const { service, db } = setup();
      const upgrade = buildUpgrade();

      db.upgrade.count.mockResolvedValue(1);
      db.upgrade.findMany.mockResolvedValue([upgrade]);
      db.userUpgrade.findMany.mockResolvedValue([
        { upgradeId: upgrade.id, level: 2 },
      ]);

      const result = await service.getUpgrades(USER_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.upgrades[0].ownedLevel).toBe(2);
      expect(result.upgrades[0].nextLevelPrice).toBe(
        calculateUpgradePrice(100, 1.5, 2),
      );
      expect(result.upgrades[0].isMaxLevel).toBe(false);
      expect(result.upgrades[0].effectTypeLabel).toBe('Сила клика');
    });

    it('marks maxed upgrades and returns a zero next price', async () => {
      const { service, db } = setup();
      const upgrade = buildUpgrade({ maxLevel: 3 });

      db.upgrade.count.mockResolvedValue(1);
      db.upgrade.findMany.mockResolvedValue([upgrade]);
      db.userUpgrade.findMany.mockResolvedValue([
        { upgradeId: upgrade.id, level: 3 },
      ]);

      const result = await service.getUpgrades(USER_ID, {});

      expect(result.upgrades[0].isMaxLevel).toBe(true);
      expect(result.upgrades[0].nextLevelPrice).toBe(0);
    });
  });

  describe('buyUpgrade', () => {
    it('charges a geometric price and increases click power', async () => {
      const { service, tx, redis } = setup();
      const upgrade = buildUpgrade();

      tx.upgrade.findUnique.mockResolvedValue(upgrade);
      tx.userUpgrade.findUnique.mockResolvedValue({ level: 1 });
      tx.playerStatistic.findUnique.mockResolvedValue({
        id: 'stats-1',
        coins: 500n,
      });
      tx.playerStatistic.update.mockResolvedValue({
        id: 'stats-1',
        coins: 350n,
      });
      tx.userUpgrade.upsert.mockResolvedValue({
        id: 'owned-1',
        level: 2,
        upgrade,
        createdAt: NOW,
        updatedAt: NOW,
      });

      const result = await service.buyUpgrade(USER_ID, {
        upgradeId: upgrade.id,
      });

      const price = BigInt(calculateUpgradePrice(100, 1.5, 1));

      expect(tx.playerStatistic.update).toHaveBeenCalledWith({
        where: { id: 'stats-1' },
        data: {
          coins: { decrement: price },
          clickPower: { increment: 1 },
        },
      });
      expect(tx.userUpgrade.upsert).toHaveBeenCalledWith({
        where: {
          userId_upgradeId: { userId: USER_ID, upgradeId: upgrade.id },
        },
        create: { userId: USER_ID, upgradeId: upgrade.id, level: 1 },
        update: { level: { increment: 1 } },
        include: { upgrade: true },
      });
      expect(result.spentCoins).toBe('150');
      expect(result.coinsBalance).toBe('350');
      expect(result.userUpgrade.level).toBe(2);
      expect(redis.del).toHaveBeenCalledWith(CACHE_KEYS.me(USER_ID));
    });

    it('increases auto income and refreshes the sync timestamp', async () => {
      const { service, tx } = setup();
      const upgrade = buildUpgrade({
        effectType: 'AUTO_INCOME',
        effectValue: 2,
        basePrice: 250,
      });

      tx.upgrade.findUnique.mockResolvedValue(upgrade);
      tx.userUpgrade.findUnique.mockResolvedValue(null);
      tx.playerStatistic.findUnique.mockResolvedValue({
        id: 'stats-1',
        coins: 1000n,
      });
      tx.playerStatistic.update.mockResolvedValue({
        id: 'stats-1',
        coins: 750n,
      });
      tx.userUpgrade.upsert.mockResolvedValue({
        id: 'owned-1',
        level: 1,
        upgrade,
        createdAt: NOW,
        updatedAt: NOW,
      });

      await service.buyUpgrade(USER_ID, { upgradeId: upgrade.id });

      expect(tx.playerStatistic.update).toHaveBeenCalledWith({
        where: { id: 'stats-1' },
        data: {
          coins: { decrement: 250n },
          autoIncome: { increment: 2 },
          lastSyncAt: expect.any(Date),
        },
      });
    });

    it('throws when the upgrade is already at max level', async () => {
      const { service, tx } = setup();
      const upgrade = buildUpgrade({ maxLevel: 3 });

      tx.upgrade.findUnique.mockResolvedValue(upgrade);
      tx.userUpgrade.findUnique.mockResolvedValue({ level: 3 });

      await expect(
        service.buyUpgrade(USER_ID, { upgradeId: upgrade.id }),
      ).rejects.toThrow(UPGRADE_MESSAGES.MAX_LEVEL_REACHED_WITH_VALUE(3));
    });

    it('throws when the upgrade does not exist', async () => {
      const { service, tx } = setup();

      tx.upgrade.findUnique.mockResolvedValue(null);

      await expect(
        service.buyUpgrade(USER_ID, { upgradeId: 'missing' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when there are not enough coins', async () => {
      const { service, tx } = setup();
      const upgrade = buildUpgrade();

      tx.upgrade.findUnique.mockResolvedValue(upgrade);
      tx.userUpgrade.findUnique.mockResolvedValue(null);
      tx.playerStatistic.findUnique.mockResolvedValue({
        id: 'stats-1',
        coins: 50n,
      });

      await expect(
        service.buyUpgrade(USER_ID, { upgradeId: upgrade.id }),
      ).rejects.toThrow(SHOP_MESSAGES.INSUFFICIENT_COINS(100, '50'));
    });

    it('throws when the statistics are missing', async () => {
      const { service, tx } = setup();

      tx.upgrade.findUnique.mockResolvedValue(buildUpgrade());
      tx.userUpgrade.findUnique.mockResolvedValue(null);
      tx.playerStatistic.findUnique.mockResolvedValue(null);

      await expect(
        service.buyUpgrade(USER_ID, { upgradeId: 'upgrade-1' }),
      ).rejects.toThrow(PET_MESSAGES.STATISTICS_NOT_FOUND);
    });
  });
});
