import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { mapFood } from '@org/pet-mappers';
import { buildPaginationMeta, normalizePagination } from '@org/pet-utils';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { FOOD_MESSAGES } from '@org/validation-messages';

import type { Food, Prisma } from '@org/database';
import type {
  CreateFoodAdminInput,
  FoodAdminServiceContract,
  FoodEntity,
  PaginatedFoodsOutput,
  PaginationInput,
  UpdateFoodAdminInput,
} from '@org/types';

@Injectable()
export class FoodAdminService implements FoodAdminServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getFoods(pagination: PaginationInput): Promise<PaginatedFoodsOutput> {
    const normalized = normalizePagination(pagination);
    const where: Prisma.FoodWhereInput = normalized.search
      ? { name: { contains: normalized.search, mode: 'insensitive' } }
      : {};

    const [total, foods] = await Promise.all([
      this.db.food.count({ where }),
      this.db.food.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: normalized.skip,
        take: normalized.limit,
      }),
    ]);

    return {
      pagination: buildPaginationMeta(normalized, total),
      foods: foods.map(mapFood),
    };
  }

  async getFoodById(foodId: string): Promise<FoodEntity> {
    return mapFood(await this.findFood(foodId));
  }

  async createFood(input: CreateFoodAdminInput): Promise<FoodEntity> {
    const food = await this.db.food.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        hungerRestore: input.hungerRestore,
        moodBonus: input.moodBonus,
      },
    });

    return mapFood(food);
  }

  async updateFood(
    foodId: string,
    input: UpdateFoodAdminInput,
  ): Promise<FoodEntity> {
    await this.findFood(foodId);
    const data: Prisma.FoodUncheckedUpdateInput = {};

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

    if (input.hungerRestore !== undefined) {
      data.hungerRestore = input.hungerRestore;
    }

    if (input.moodBonus !== undefined) {
      data.moodBonus = input.moodBonus;
    }

    const food = await this.db.food.update({
      where: { id: foodId },
      data,
    });

    await this.invalidateMeCaches();

    return mapFood(food);
  }

  async deleteFood(foodId: string): Promise<void> {
    await this.findFood(foodId);

    const usage = await this.db.foodInventory.count({
      where: { foodId },
    });

    if (usage > 0) {
      throw new ConflictException(FOOD_MESSAGES.DELETE_CONFLICT);
    }

    await this.db.food.delete({ where: { id: foodId } });
    await this.invalidateMeCaches();
  }

  private async findFood(foodId: string): Promise<Food> {
    const food = await this.db.food.findUnique({ where: { id: foodId } });

    if (!food) {
      throw new NotFoundException(FOOD_MESSAGES.NOT_FOUND);
    }

    return food;
  }

  private async invalidateMeCaches(): Promise<void> {
    await this.redis.delByPrefix(CACHE_KEYS.mePrefix());
  }
}
