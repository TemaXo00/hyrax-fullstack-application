import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { CACHE_KEYS, RedisService } from '@org/redis';
import {
  FOOD_MESSAGES,
  PET_MESSAGES,
  SHOP_MESSAGES,
} from '@org/validation-messages';

import { buildPaginationMeta, normalizePagination } from './shop.helpers';
import { mapFood, mapFoodInventory } from '../mappers/game.mappers';

import type { Prisma } from '@org/database';
import type {
  BuyFoodInput,
  FoodPurchaseEntity,
  FoodShopServiceContract,
  PaginatedFoodsOutput,
  PaginationInput,
} from '@org/types';

@Injectable()
export class FoodShopService implements FoodShopServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getFoods(pagination: PaginationInput): Promise<PaginatedFoodsOutput> {
    const normalized = normalizePagination(pagination);
    const where: Prisma.FoodWhereInput = {
      isActive: true,
      ...(normalized.search
        ? { name: { contains: normalized.search, mode: 'insensitive' } }
        : {}),
    };

    const [total, foods] = await Promise.all([
      this.db.food.count({ where }),
      this.db.food.findMany({
        where,
        orderBy: { price: 'asc' },
        skip: normalized.skip,
        take: normalized.limit,
      }),
    ]);

    return {
      pagination: buildPaginationMeta(normalized, total),
      foods: foods.map(mapFood),
    };
  }

  async buyFood(
    userId: string,
    input: BuyFoodInput,
  ): Promise<FoodPurchaseEntity> {
    const result = await this.db.$transaction(async (tx) => {
      const food = await tx.food.findUnique({ where: { id: input.foodId } });

      if (!food) {
        throw new NotFoundException(FOOD_MESSAGES.NOT_FOUND);
      }

      if (!food.isActive) {
        throw new BadRequestException(FOOD_MESSAGES.INACTIVE);
      }

      const stats = await tx.playerStatistic.findUnique({
        where: { playerId: userId },
      });

      if (!stats) {
        throw new NotFoundException(PET_MESSAGES.STATISTICS_NOT_FOUND);
      }

      const totalPrice = food.price * input.quantity;
      const price = BigInt(totalPrice);

      if (stats.coins < price) {
        throw new BadRequestException(
          SHOP_MESSAGES.INSUFFICIENT_COINS(totalPrice, stats.coins.toString()),
        );
      }

      const updatedStats = await tx.playerStatistic.update({
        where: { id: stats.id },
        data: { coins: { decrement: price } },
      });

      const inventory = await tx.foodInventory.upsert({
        where: { foodId_userId: { foodId: food.id, userId } },
        create: {
          foodId: food.id,
          userId,
          quantity: input.quantity,
        },
        update: { quantity: { increment: input.quantity } },
        include: { food: true },
      });

      return {
        inventory: mapFoodInventory(inventory),
        spentCoins: price.toString(),
        coinsBalance: updatedStats.coins.toString(),
      };
    });

    await this.invalidateMeCache(userId);

    return result;
  }

  private async invalidateMeCache(userId: string): Promise<void> {
    await this.redis.del(CACHE_KEYS.me(userId));
  }
}
