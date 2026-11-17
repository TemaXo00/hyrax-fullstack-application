import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { mapCosmetic } from '@org/pet-mappers';
import { buildPaginationMeta, normalizePagination } from '@org/pet-utils';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { COSMETIC_MESSAGES } from '@org/validation-messages';

import type { Cosmetic, Prisma } from '@org/database';
import type {
  CosmeticAdminServiceContract,
  CosmeticEntity,
  CreateCosmeticAdminInput,
  PaginatedCosmeticsOutput,
  PaginationInput,
  UpdateCosmeticAdminInput,
} from '@org/types';

@Injectable()
export class CosmeticAdminService implements CosmeticAdminServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getCosmetics(
    pagination: PaginationInput,
  ): Promise<PaginatedCosmeticsOutput> {
    const normalized = normalizePagination(pagination);
    const where: Prisma.CosmeticWhereInput = normalized.search
      ? { name: { contains: normalized.search, mode: 'insensitive' } }
      : {};

    const [total, cosmetics] = await Promise.all([
      this.db.cosmetic.count({ where }),
      this.db.cosmetic.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: normalized.skip,
        take: normalized.limit,
      }),
    ]);

    return {
      pagination: buildPaginationMeta(normalized, total),
      cosmetics: cosmetics.map(mapCosmetic),
    };
  }

  async getCosmeticById(cosmeticId: string): Promise<CosmeticEntity> {
    return mapCosmetic(await this.findCosmetic(cosmeticId));
  }

  async createCosmetic(
    input: CreateCosmeticAdminInput,
  ): Promise<CosmeticEntity> {
    const cosmetic = await this.db.cosmetic.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        slot: input.slot,
        rarity: input.rarity,
      },
    });

    return mapCosmetic(cosmetic);
  }

  async updateCosmetic(
    cosmeticId: string,
    input: UpdateCosmeticAdminInput,
  ): Promise<CosmeticEntity> {
    await this.findCosmetic(cosmeticId);
    const data: Prisma.CosmeticUncheckedUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.price !== undefined) {
      data.price = input.price;
    }

    if (input.imageUrl !== undefined) {
      data.imageUrl = input.imageUrl;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    if (input.slot !== undefined) {
      data.slot = input.slot;
    }

    if (input.rarity !== undefined) {
      data.rarity = input.rarity;
    }

    const cosmetic = await this.db.cosmetic.update({
      where: { id: cosmeticId },
      data,
    });

    await this.invalidateMeCaches();

    return mapCosmetic(cosmetic);
  }

  async deleteCosmetic(cosmeticId: string): Promise<void> {
    await this.findCosmetic(cosmeticId);

    const [inventoryUsage, rewardUsage] = await Promise.all([
      this.db.cosmeticInventory.count({ where: { cosmeticId } }),
      this.db.dailyRewardConfig.count({ where: { rewardItemId: cosmeticId } }),
    ]);

    if (inventoryUsage > 0 || rewardUsage > 0) {
      throw new ConflictException(COSMETIC_MESSAGES.DELETE_CONFLICT);
    }

    await this.db.cosmetic.delete({ where: { id: cosmeticId } });
    await this.invalidateMeCaches();
  }

  private async findCosmetic(cosmeticId: string): Promise<Cosmetic> {
    const cosmetic = await this.db.cosmetic.findUnique({
      where: { id: cosmeticId },
    });

    if (!cosmetic) {
      throw new NotFoundException(COSMETIC_MESSAGES.NOT_FOUND);
    }

    return cosmetic;
  }

  private async invalidateMeCaches(): Promise<void> {
    await this.redis.delByPrefix(CACHE_KEYS.mePrefix());
  }
}
