import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { CACHE_KEYS, RedisService } from '@org/redis';
import {
  PET_MESSAGES,
  SHOP_MESSAGES,
  UPGRADE_MESSAGES,
} from '@org/validation-messages';

import { buildPaginationMeta, normalizePagination } from './shop.helpers';
import { calculateUpgradePrice } from '../game/pet-game.rules';
import { mapUpgrade, mapUserUpgrade } from '../mappers/game.mappers';

import type { Prisma } from '@org/database';
import type {
  BuyUpgradeInput,
  PaginatedUpgradesOutput,
  PaginationInput,
  UpgradePurchaseEntity,
  UpgradeShopEntity,
  UpgradeShopServiceContract,
} from '@org/types';

@Injectable()
export class UpgradeShopService implements UpgradeShopServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getUpgrades(
    userId: string,
    pagination: PaginationInput,
  ): Promise<PaginatedUpgradesOutput> {
    const normalized = normalizePagination(pagination);
    const where: Prisma.UpgradeWhereInput = normalized.search
      ? { name: { contains: normalized.search, mode: 'insensitive' } }
      : {};

    const [total, upgrades, owned] = await Promise.all([
      this.db.upgrade.count({ where }),
      this.db.upgrade.findMany({
        where,
        orderBy: { basePrice: 'asc' },
        skip: normalized.skip,
        take: normalized.limit,
      }),
      this.db.userUpgrade.findMany({
        where: { userId },
        select: { upgradeId: true, level: true },
      }),
    ]);

    const ownedLevels = new Map(
      owned.map((item) => [item.upgradeId, item.level]),
    );

    return {
      pagination: buildPaginationMeta(normalized, total),
      upgrades: upgrades.map((upgrade) => {
        const ownedLevel = ownedLevels.get(upgrade.id) ?? 0;
        const isMaxLevel = ownedLevel >= upgrade.maxLevel;

        return {
          ...mapUpgrade(upgrade),
          ownedLevel,
          nextLevelPrice: this.getNextLevelPrice(upgrade, ownedLevel),
          isMaxLevel,
        } satisfies UpgradeShopEntity;
      }),
    };
  }

  async buyUpgrade(
    userId: string,
    input: BuyUpgradeInput,
  ): Promise<UpgradePurchaseEntity> {
    const now = new Date();
    const result = await this.db.$transaction(async (tx) => {
      const upgrade = await tx.upgrade.findUnique({
        where: { id: input.upgradeId },
      });

      if (!upgrade) {
        throw new NotFoundException(UPGRADE_MESSAGES.NOT_FOUND);
      }

      const owned = await tx.userUpgrade.findUnique({
        where: {
          userId_upgradeId: { userId, upgradeId: upgrade.id },
        },
      });
      const currentLevel = owned?.level ?? 0;

      if (currentLevel >= upgrade.maxLevel) {
        throw new BadRequestException(
          UPGRADE_MESSAGES.MAX_LEVEL_REACHED_WITH_VALUE(upgrade.maxLevel),
        );
      }

      const stats = await tx.playerStatistic.findUnique({
        where: { playerId: userId },
      });

      if (!stats) {
        throw new NotFoundException(PET_MESSAGES.STATISTICS_NOT_FOUND);
      }

      const price = calculateUpgradePrice(
        upgrade.basePrice,
        Number(upgrade.priceMultiplier),
        currentLevel,
      );
      const priceValue = BigInt(price);

      if (stats.coins < priceValue) {
        throw new BadRequestException(
          SHOP_MESSAGES.INSUFFICIENT_COINS(price, stats.coins.toString()),
        );
      }

      const updatedStats = await tx.playerStatistic.update({
        where: { id: stats.id },
        data: {
          coins: { decrement: priceValue },
          ...(upgrade.effectType === 'CLICK_POWER'
            ? { clickPower: { increment: upgrade.effectValue } }
            : {
                autoIncome: { increment: upgrade.effectValue },
                lastSyncAt: now,
              }),
        },
      });
      const userUpgrade = await tx.userUpgrade.upsert({
        where: {
          userId_upgradeId: { userId, upgradeId: upgrade.id },
        },
        create: { userId, upgradeId: upgrade.id, level: 1 },
        update: { level: { increment: 1 } },
        include: { upgrade: true },
      });

      return {
        userUpgrade: mapUserUpgrade(userUpgrade),
        spentCoins: priceValue.toString(),
        coinsBalance: updatedStats.coins.toString(),
      };
    });

    await this.invalidateMeCache(userId);

    return result;
  }

  private getNextLevelPrice(
    upgrade: {
      basePrice: number;
      priceMultiplier: unknown;
      maxLevel: number;
    },
    ownedLevel: number,
  ): number {
    if (ownedLevel >= upgrade.maxLevel) {
      return 0;
    }

    return calculateUpgradePrice(
      upgrade.basePrice,
      Number(upgrade.priceMultiplier),
      ownedLevel,
    );
  }

  private async invalidateMeCache(userId: string): Promise<void> {
    await this.redis.del(CACHE_KEYS.me(userId));
  }
}
