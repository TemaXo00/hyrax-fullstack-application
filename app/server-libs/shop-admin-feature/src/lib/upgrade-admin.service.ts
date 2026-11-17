import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { mapUpgrade } from '@org/pet-mappers';
import { buildPaginationMeta, normalizePagination } from '@org/pet-utils';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { UPGRADE_MESSAGES } from '@org/validation-messages';

import type { Prisma, Upgrade } from '@org/database';
import type {
  CreateUpgradeAdminInput,
  PaginatedUpgradesAdminOutput,
  PaginationInput,
  UpdateUpgradeAdminInput,
  UpgradeAdminServiceContract,
  UpgradeEntity,
} from '@org/types';

@Injectable()
export class UpgradeAdminService implements UpgradeAdminServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getUpgrades(
    pagination: PaginationInput,
  ): Promise<PaginatedUpgradesAdminOutput> {
    const normalized = normalizePagination(pagination);
    const where: Prisma.UpgradeWhereInput = normalized.search
      ? { name: { contains: normalized.search, mode: 'insensitive' } }
      : {};

    const [total, upgrades] = await Promise.all([
      this.db.upgrade.count({ where }),
      this.db.upgrade.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: normalized.skip,
        take: normalized.limit,
      }),
    ]);

    return {
      pagination: buildPaginationMeta(normalized, total),
      upgrades: upgrades.map(mapUpgrade),
    };
  }

  async getUpgradeById(upgradeId: string): Promise<UpgradeEntity> {
    return mapUpgrade(await this.findUpgrade(upgradeId));
  }

  async createUpgrade(input: CreateUpgradeAdminInput): Promise<UpgradeEntity> {
    const upgrade = await this.db.upgrade.create({
      data: {
        name: input.name,
        description: input.description,
        imageUrl: input.imageUrl,
        effectType: input.effectType,
        effectValue: input.effectValue,
        basePrice: input.basePrice,
        priceMultiplier: input.priceMultiplier,
        maxLevel: input.maxLevel,
      },
    });

    return mapUpgrade(upgrade);
  }

  async updateUpgrade(
    upgradeId: string,
    input: UpdateUpgradeAdminInput,
  ): Promise<UpgradeEntity> {
    await this.findUpgrade(upgradeId);
    const data: Prisma.UpgradeUncheckedUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.imageUrl !== undefined) {
      data.imageUrl = input.imageUrl;
    }

    if (input.effectType !== undefined) {
      data.effectType = input.effectType;
    }

    if (input.effectValue !== undefined) {
      data.effectValue = input.effectValue;
    }

    if (input.basePrice !== undefined) {
      data.basePrice = input.basePrice;
    }

    if (input.priceMultiplier !== undefined) {
      data.priceMultiplier = input.priceMultiplier;
    }

    if (input.maxLevel !== undefined) {
      data.maxLevel = input.maxLevel;
    }

    const upgrade = await this.db.upgrade.update({
      where: { id: upgradeId },
      data,
    });

    await this.invalidateMeCaches();

    return mapUpgrade(upgrade);
  }

  async deleteUpgrade(upgradeId: string): Promise<void> {
    await this.findUpgrade(upgradeId);

    const usage = await this.db.userUpgrade.count({
      where: { upgradeId },
    });

    if (usage > 0) {
      throw new ConflictException(UPGRADE_MESSAGES.DELETE_CONFLICT);
    }

    await this.db.upgrade.delete({ where: { id: upgradeId } });
    await this.invalidateMeCaches();
  }

  private async findUpgrade(upgradeId: string): Promise<Upgrade> {
    const upgrade = await this.db.upgrade.findUnique({
      where: { id: upgradeId },
    });

    if (!upgrade) {
      throw new NotFoundException(UPGRADE_MESSAGES.NOT_FOUND);
    }

    return upgrade;
  }

  private async invalidateMeCaches(): Promise<void> {
    await this.redis.delByPrefix(CACHE_KEYS.mePrefix());
  }
}
