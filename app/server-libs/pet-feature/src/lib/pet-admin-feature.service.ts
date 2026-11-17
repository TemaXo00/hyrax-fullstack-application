import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { mapPet, mapPlayerStatistic } from '@org/pet-mappers';
import { buildPaginationMeta, normalizePagination } from '@org/pet-utils';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { getUserRoleLabel } from '@org/types';
import { PET_MESSAGES } from '@org/validation-messages';

import type { Prisma } from '@org/database';
import type {
  PaginatedPetsAdminOutput,
  PetAdminEntity,
  PetAdminFilterInput,
  PetAdminServiceContract,
  UpdatePetAdminInput,
  UpdatePlayerStatisticAdminInput,
} from '@org/types';

const PET_ADMIN_INCLUDE = {
  user: {
    select: {
      id: true,
      nickname: true,
      role: true,
      isBlocked: true,
      stats: true,
    },
  },
} satisfies Prisma.PetInclude;

type PetAdminView = Prisma.PetGetPayload<{
  include: typeof PET_ADMIN_INCLUDE;
}>;

@Injectable()
export class PetAdminFeatureService implements PetAdminServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getPets(
    pagination: PetAdminFilterInput,
  ): Promise<PaginatedPetsAdminOutput> {
    const normalized = normalizePagination(pagination);
    const where = this.buildPetsQuery(pagination, normalized.search);

    const [total, pets] = await Promise.all([
      this.db.pet.count({ where }),
      this.db.pet.findMany({
        where,
        include: PET_ADMIN_INCLUDE,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: normalized.skip,
        take: normalized.limit,
      }),
    ]);

    return {
      pagination: buildPaginationMeta(normalized, total),
      pets: pets.map((pet) => this.mapPetAdmin(pet)),
    };
  }

  async getPetById(petId: string): Promise<PetAdminEntity> {
    return this.mapPetAdmin(await this.findPetById(petId));
  }

  async updatePet(
    petId: string,
    input: UpdatePetAdminInput,
  ): Promise<PetAdminEntity> {
    const pet = await this.findPetById(petId);
    const now = new Date();
    const data: Prisma.PetUncheckedUpdateInput = { updatedAt: now };

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.level !== undefined) {
      data.level = input.level;
    }

    if (input.xp !== undefined) {
      data.xp = input.xp;
    }

    if (input.hunger !== undefined) {
      data.hunger = input.hunger;
      data.lastHungerAt = now;
    }

    if (input.mood !== undefined) {
      data.mood = input.mood;
      data.lastMoodAt = now;
    }

    await this.db.pet.update({
      where: { id: pet.id },
      data,
    });

    await this.redis.del(CACHE_KEYS.me(pet.user.id));

    return await this.getPetById(petId);
  }

  async updateStatistics(
    petId: string,
    input: UpdatePlayerStatisticAdminInput,
  ): Promise<PetAdminEntity> {
    const pet = await this.findPetById(petId);
    const now = new Date();
    const data: Prisma.PlayerStatisticUncheckedUpdateInput = {
      updatedAt: now,
    };

    if (input.coins !== undefined) {
      data.coins = BigInt(input.coins);
    }

    if (input.totalCoinsEarned !== undefined) {
      data.totalCoinsEarned = BigInt(input.totalCoinsEarned);
    }

    if (input.totalClicks !== undefined) {
      data.totalClicks = BigInt(input.totalClicks);
    }

    if (input.totalFeeds !== undefined) {
      data.totalFeeds = BigInt(input.totalFeeds);
    }

    if (input.streak !== undefined) {
      data.streak = input.streak;
    }

    if (input.clickPower !== undefined) {
      data.clickPower = input.clickPower;
    }

    if (input.autoIncome !== undefined) {
      data.autoIncome = input.autoIncome;
      data.lastSyncAt = now;
    }

    await this.db.playerStatistic.update({
      where: { playerId: pet.user.id },
      data,
    });

    await this.redis.del(CACHE_KEYS.me(pet.user.id));

    return await this.getPetById(petId);
  }

  private buildPetsQuery(
    pagination: PetAdminFilterInput,
    search?: string,
  ): Prisma.PetWhereInput {
    const level: Prisma.IntFilter = {};

    if (pagination.minLevel !== undefined) {
      level.gte = pagination.minLevel;
    }

    if (pagination.maxLevel !== undefined) {
      level.lte = pagination.maxLevel;
    }

    return {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              {
                user: {
                  nickname: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(Object.keys(level).length > 0 ? { level } : {}),
    };
  }

  private async findPetById(petId: string): Promise<PetAdminView> {
    const pet = await this.db.pet.findUnique({
      where: { id: petId },
      include: PET_ADMIN_INCLUDE,
    });

    if (!pet) {
      throw new NotFoundException(PET_MESSAGES.PET_NOT_FOUND);
    }

    return pet;
  }

  private mapPetAdmin(pet: PetAdminView): PetAdminEntity {
    return {
      ...mapPet(pet),
      owner: {
        id: pet.user.id,
        nickname: pet.user.nickname,
        role: pet.user.role,
        roleLabel: getUserRoleLabel(pet.user.role),
        isBlocked: pet.user.isBlocked,
      },
      statistics: pet.user.stats ? mapPlayerStatistic(pet.user.stats) : null,
    };
  }
}
