import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { CACHE_KEYS, RedisService } from '@org/redis';
import {
  COSMETIC_MESSAGES,
  PET_MESSAGES,
  SHOP_MESSAGES,
} from '@org/validation-messages';

import { buildPaginationMeta, normalizePagination } from './shop.helpers';
import { mapCosmetic, mapCosmeticInventory } from '../mappers/game.mappers';

import type { Prisma } from '@org/database';
import type {
  CosmeticInventoryEntity,
  CosmeticPurchaseEntity,
  CosmeticShopServiceContract,
  EquipCosmeticInput,
  PaginatedCosmeticsOutput,
  PaginationInput,
} from '@org/types';

@Injectable()
export class CosmeticShopService implements CosmeticShopServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getCosmetics(
    pagination: PaginationInput,
  ): Promise<PaginatedCosmeticsOutput> {
    const normalized = normalizePagination(pagination);
    const where: Prisma.CosmeticWhereInput = {
      isActive: true,
      ...(normalized.search
        ? { name: { contains: normalized.search, mode: 'insensitive' } }
        : {}),
    };

    const [total, cosmetics] = await Promise.all([
      this.db.cosmetic.count({ where }),
      this.db.cosmetic.findMany({
        where,
        orderBy: [{ slot: 'asc' }, { price: 'asc' }],
        skip: normalized.skip,
        take: normalized.limit,
      }),
    ]);

    return {
      pagination: buildPaginationMeta(normalized, total),
      cosmetics: cosmetics.map(mapCosmetic),
    };
  }

  async buyCosmetic(
    userId: string,
    cosmeticId: string,
  ): Promise<CosmeticPurchaseEntity> {
    const result = await this.db.$transaction(async (tx) => {
      const cosmetic = await tx.cosmetic.findUnique({
        where: { id: cosmeticId },
      });

      if (!cosmetic) {
        throw new NotFoundException(COSMETIC_MESSAGES.NOT_FOUND);
      }

      if (!cosmetic.isActive) {
        throw new BadRequestException(COSMETIC_MESSAGES.INACTIVE);
      }

      const existing = await tx.cosmeticInventory.findUnique({
        where: { cosmeticId_userId: { cosmeticId, userId } },
      });

      if (existing) {
        throw new BadRequestException(COSMETIC_MESSAGES.ALREADY_OWNED);
      }

      const stats = await tx.playerStatistic.findUnique({
        where: { playerId: userId },
      });

      if (!stats) {
        throw new NotFoundException(PET_MESSAGES.STATISTICS_NOT_FOUND);
      }

      const price = BigInt(cosmetic.price);

      if (stats.coins < price) {
        throw new BadRequestException(
          SHOP_MESSAGES.INSUFFICIENT_COINS(
            cosmetic.price,
            stats.coins.toString(),
          ),
        );
      }

      const updatedStats = await tx.playerStatistic.update({
        where: { id: stats.id },
        data: { coins: { decrement: price } },
      });
      const inventory = await tx.cosmeticInventory.create({
        data: { cosmeticId, userId },
        include: { cosmetic: true },
      });

      return {
        inventory: mapCosmeticInventory(inventory),
        spentCoins: price.toString(),
        coinsBalance: updatedStats.coins.toString(),
      };
    });

    await this.invalidateMeCache(userId);

    return result;
  }

  async equipCosmetic(
    userId: string,
    cosmeticId: string,
    input: EquipCosmeticInput,
  ): Promise<CosmeticInventoryEntity> {
    const result = await this.db.$transaction(async (tx) => {
      const inventory = await tx.cosmeticInventory.findUnique({
        where: { cosmeticId_userId: { cosmeticId, userId } },
        include: { cosmetic: true },
      });

      if (!inventory) {
        throw new NotFoundException(COSMETIC_MESSAGES.NOT_OWNED);
      }

      if (input.equipped) {
        await tx.cosmeticInventory.updateMany({
          where: {
            userId,
            cosmetic: { slot: inventory.cosmetic.slot },
            NOT: { id: inventory.id },
          },
          data: { isEquipped: false },
        });
      }

      const updated = await tx.cosmeticInventory.update({
        where: { id: inventory.id },
        data: { isEquipped: input.equipped },
        include: { cosmetic: true },
      });

      return mapCosmeticInventory(updated);
    });

    await this.invalidateMeCache(userId);

    return result;
  }

  private async invalidateMeCache(userId: string): Promise<void> {
    await this.redis.del(CACHE_KEYS.me(userId));
  }
}
