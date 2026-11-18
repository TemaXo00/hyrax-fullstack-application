import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { mapAchievement } from '@org/pet-mappers';
import { buildPaginationMeta, normalizePagination } from '@org/pet-utils';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { ACHIEVEMENT_MESSAGES } from '@org/validation-messages';

import type { Achievment, Prisma } from '@org/database';
import type {
  AchievementAdminServiceContract,
  AchievementEntity,
  AchievementQueryInput,
  CreateAchievementAdminInput,
  PaginatedAchievementCatalogOutput,
  UpdateAchievementAdminInput,
} from '@org/types';

@Injectable()
export class AchievementAdminService implements AchievementAdminServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getAchievements(
    query: AchievementQueryInput,
  ): Promise<PaginatedAchievementCatalogOutput> {
    const normalized = normalizePagination(query);
    const where: Prisma.AchievmentWhereInput = {};

    if (normalized.search) {
      where.OR = [
        { code: { contains: normalized.search, mode: 'insensitive' } },
        { title: { contains: normalized.search, mode: 'insensitive' } },
      ];
    }

    if (query.conditionType) {
      where.conditionType = query.conditionType;
    }

    const [total, achievements] = await Promise.all([
      this.db.achievment.count({ where }),
      this.db.achievment.findMany({
        where,
        orderBy: [
          { conditionType: 'asc' },
          { conditionValue: 'asc' },
          { id: 'asc' },
        ],
        skip: normalized.skip,
        take: normalized.limit,
      }),
    ]);

    return {
      pagination: buildPaginationMeta(normalized, total),
      achievements: achievements.map(mapAchievement),
    };
  }

  async getAchievementById(achievementId: string): Promise<AchievementEntity> {
    return mapAchievement(await this.findAchievement(achievementId));
  }

  async createAchievement(
    input: CreateAchievementAdminInput,
  ): Promise<AchievementEntity> {
    await this.ensureCodeIsFree(input.code);

    const achievement = await this.db.achievment.create({
      data: {
        code: input.code,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        conditionType: input.conditionType,
        conditionValue: input.conditionValue,
        ...(input.rewardCoins !== undefined
          ? { rewardCoins: input.rewardCoins }
          : {}),
      },
    });

    await this.invalidateMeCaches();

    return mapAchievement(achievement);
  }

  async updateAchievement(
    achievementId: string,
    input: UpdateAchievementAdminInput,
  ): Promise<AchievementEntity> {
    const achievement = await this.findAchievement(achievementId);

    if (input.code !== undefined && input.code !== achievement.code) {
      await this.ensureCodeIsFree(input.code);
    }

    const data: Prisma.AchievmentUncheckedUpdateInput = {};

    if (input.code !== undefined) {
      data.code = input.code;
    }

    if (input.title !== undefined) {
      data.title = input.title;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.imageUrl !== undefined) {
      data.imageUrl = input.imageUrl;
    }

    if (input.conditionType !== undefined) {
      data.conditionType = input.conditionType;
    }

    if (input.conditionValue !== undefined) {
      data.conditionValue = input.conditionValue;
    }

    if (input.rewardCoins !== undefined) {
      data.rewardCoins = input.rewardCoins;
    }

    const updated = await this.db.achievment.update({
      where: { id: achievementId },
      data,
    });

    await this.invalidateMeCaches();

    return mapAchievement(updated);
  }

  async deleteAchievement(achievementId: string): Promise<void> {
    await this.findAchievement(achievementId);

    const usage = await this.db.userAchievment.count({
      where: { achievmentId: achievementId },
    });

    if (usage > 0) {
      throw new ConflictException(ACHIEVEMENT_MESSAGES.DELETE_CONFLICT);
    }

    await this.db.achievment.delete({ where: { id: achievementId } });
    await this.invalidateMeCaches();
  }

  private async ensureCodeIsFree(code: string): Promise<void> {
    const existing = await this.db.achievment.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(ACHIEVEMENT_MESSAGES.CODE_CONFLICT);
    }
  }

  private async findAchievement(achievementId: string): Promise<Achievment> {
    const achievement = await this.db.achievment.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new NotFoundException(ACHIEVEMENT_MESSAGES.NOT_FOUND);
    }

    return achievement;
  }

  private async invalidateMeCaches(): Promise<void> {
    await this.redis.delByPrefix(CACHE_KEYS.mePrefix());
  }
}
