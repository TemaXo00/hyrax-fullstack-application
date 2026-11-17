import { ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { UPGRADE_MESSAGES } from '@org/validation-messages';

import { UpgradeAdminService } from './upgrade-admin.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const UPGRADE_ID = 'upgrade-1';

interface UpgradeRecord {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  effectType: 'CLICK_POWER' | 'AUTO_INCOME';
  effectValue: number;
  basePrice: number;
  priceMultiplier: unknown;
  maxLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

function buildUpgrade(overrides: Partial<UpgradeRecord> = {}): UpgradeRecord {
  return {
    id: UPGRADE_ID,
    name: 'Крепкая лапа',
    description: null,
    imageUrl: null,
    effectType: 'CLICK_POWER',
    effectValue: 1,
    basePrice: 100,
    priceMultiplier: 1.5,
    maxLevel: 10,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function setup(): {
  service: UpgradeAdminService;
  db: {
    upgrade: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    userUpgrade: { count: jest.Mock };
  };
  redis: { delByPrefix: jest.Mock };
} {
  const db = {
    upgrade: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userUpgrade: {
      count: jest.fn(),
    },
  };
  const redis = {
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new UpgradeAdminService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, redis };
}

describe('UpgradeAdminService', () => {
  it('returns a paginated list of all upgrades', async () => {
    const { service, db } = setup();

    db.upgrade.count.mockResolvedValue(1);
    db.upgrade.findMany.mockResolvedValue([buildUpgrade()]);

    const result = await service.getUpgrades({ page: 1, limit: 10 });

    expect(result.upgrades[0]).toMatchObject({
      id: UPGRADE_ID,
      effectTypeLabel: 'Сила клика',
      priceMultiplier: '1.5',
    });
  });

  it('throws when upgrade is missing', async () => {
    const { service, db } = setup();

    db.upgrade.findUnique.mockResolvedValue(null);

    await expect(service.getUpgradeById(UPGRADE_ID)).rejects.toThrow(
      new NotFoundException(UPGRADE_MESSAGES.NOT_FOUND),
    );
  });

  it('creates upgrade', async () => {
    const { service, db } = setup();
    const upgrade = buildUpgrade();

    db.upgrade.create.mockResolvedValue(upgrade);

    const result = await service.createUpgrade({
      name: upgrade.name,
      effectType: upgrade.effectType,
      effectValue: upgrade.effectValue,
      basePrice: upgrade.basePrice,
      priceMultiplier: 1.5,
      maxLevel: upgrade.maxLevel,
    });

    expect(db.upgrade.create).toHaveBeenCalledWith({
      data: {
        name: upgrade.name,
        description: undefined,
        imageUrl: undefined,
        effectType: upgrade.effectType,
        effectValue: upgrade.effectValue,
        basePrice: upgrade.basePrice,
        priceMultiplier: 1.5,
        maxLevel: upgrade.maxLevel,
      },
    });
    expect(result.id).toBe(UPGRADE_ID);
  });

  it('updates upgrade and invalidates me caches', async () => {
    const { service, db, redis } = setup();
    const upgrade = buildUpgrade();

    db.upgrade.findUnique.mockResolvedValue(upgrade);
    db.upgrade.update.mockResolvedValue({ ...upgrade, basePrice: 200 });

    const result = await service.updateUpgrade(UPGRADE_ID, { basePrice: 200 });

    expect(db.upgrade.update).toHaveBeenCalledWith({
      where: { id: UPGRADE_ID },
      data: { basePrice: 200 },
    });
    expect(result.basePrice).toBe(200);
    expect(redis.delByPrefix).toHaveBeenCalledWith(CACHE_KEYS.mePrefix());
  });

  it('rejects deletion while upgrade is owned by players', async () => {
    const { service, db, redis } = setup();

    db.upgrade.findUnique.mockResolvedValue(buildUpgrade());
    db.userUpgrade.count.mockResolvedValue(1);

    await expect(service.deleteUpgrade(UPGRADE_ID)).rejects.toThrow(
      new ConflictException(UPGRADE_MESSAGES.DELETE_CONFLICT),
    );
    expect(db.upgrade.delete).not.toHaveBeenCalled();
    expect(redis.delByPrefix).not.toHaveBeenCalled();
  });

  it('deletes unused upgrade and invalidates me caches', async () => {
    const { service, db, redis } = setup();

    db.upgrade.findUnique.mockResolvedValue(buildUpgrade());
    db.userUpgrade.count.mockResolvedValue(0);

    await service.deleteUpgrade(UPGRADE_ID);

    expect(db.upgrade.delete).toHaveBeenCalledWith({
      where: { id: UPGRADE_ID },
    });
    expect(redis.delByPrefix).toHaveBeenCalledWith(CACHE_KEYS.mePrefix());
  });
});
