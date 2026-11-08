import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { getPetActionLabel } from '@org/types';
import { GAME_CONFIG } from '@org/validation-config';
import { PET_MESSAGES } from '@org/validation-messages';

import {
  applyXp,
  calculateClickReward,
  calculatePetDecay,
  calculateWalkReward,
  clampPetStat,
} from './game/pet-game.rules';
import {
  mapCosmeticInventory,
  mapFoodInventory,
  mapPet,
  mapPlayerStatistic,
  mapUserUpgrade,
} from './mappers/game.mappers';

import type { Prisma, Pet } from '@org/database';
import type {
  FeedPetInput,
  PetActionResultEntity,
  PetDecayEntity,
  PetEntity,
  PetServiceContract,
  PetStateEntity,
  RenamePetInput,
} from '@org/types';

const PROFILE_INCLUDE = {
  pet: true,
  stats: true,
} satisfies Prisma.UserInclude;

const PET_STATE_INCLUDE = {
  pet: true,
  stats: true,
  foodInventories: {
    where: { quantity: { gt: 0 } },
    include: { food: true },
    orderBy: { createdAt: 'asc' },
  },
  cosmeticInventories: {
    include: { cosmetic: true },
    orderBy: { createdAt: 'asc' },
  },
  userUpgrades: {
    include: { upgrade: true },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.UserInclude;

type ProfileView = Prisma.UserGetPayload<{ include: typeof PROFILE_INCLUDE }>;
type PetStateView = Prisma.UserGetPayload<{
  include: typeof PET_STATE_INCLUDE;
}>;

interface SyncedProfile {
  pet: Pet;
  stats: ProfileView['stats'] & object;
  autoIncomeCollected: bigint;
  changed: boolean;
}

interface ActionResultInput {
  action: PetActionResultEntity['action'];
  coinsEarned: bigint;
  xpEarned: number;
  levelsGained: number;
  autoIncomeCollected: bigint;
  pet: Pet;
  stats: PetActionResultEntity['stats'];
}

@Injectable()
export class PetFeatureService implements PetServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getState(userId: string): Promise<PetStateEntity> {
    const now = new Date();
    const { state, changed } = await this.db.$transaction(async (tx) => {
      const profile = await this.syncProfile(tx, userId, now);
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: PET_STATE_INCLUDE,
      });

      if (!user || !user.pet || !user.stats) {
        throw new NotFoundException(PET_MESSAGES.USER_NOT_FOUND);
      }

      return {
        state: this.mapState(user, profile.autoIncomeCollected, now),
        changed: profile.changed,
      };
    });

    if (changed) {
      await this.redis.del(CACHE_KEYS.me(userId));
    }

    return state;
  }

  async rename(userId: string, input: RenamePetInput): Promise<PetEntity> {
    const now = new Date();
    const pet = await this.db.$transaction(async (tx) => {
      const profile = await this.syncProfile(tx, userId, now);

      return await tx.pet.update({
        where: { id: profile.pet.id },
        data: { name: input.name, updatedAt: now },
      });
    });

    await this.invalidateMeCache(userId);

    return mapPet(pet);
  }

  async feed(
    userId: string,
    input: FeedPetInput,
  ): Promise<PetActionResultEntity> {
    const now = new Date();
    const result = await this.db.$transaction(async (tx) => {
      const profile = await this.syncProfile(tx, userId, now);
      const inventory = await tx.foodInventory.findUnique({
        where: {
          foodId_userId: {
            foodId: input.foodId,
            userId,
          },
        },
        include: { food: true },
      });

      if (!inventory || inventory.quantity < 1) {
        throw new BadRequestException(PET_MESSAGES.STORED_FOOD_NOT_FOUND);
      }

      await tx.foodInventory.update({
        where: { id: inventory.id },
        data: { quantity: { decrement: 1 } },
      });

      const mood = clampPetStat(
        profile.pet.mood + inventory.food.moodBonus,
        GAME_CONFIG.PET.MOOD_MIN,
        GAME_CONFIG.PET.MOOD_MAX,
      );
      const hunger = clampPetStat(
        profile.pet.hunger + inventory.food.hungerRestore,
        GAME_CONFIG.PET.HUNGER_MIN,
        GAME_CONFIG.PET.HUNGER_MAX,
      );
      const xp = applyXp(
        profile.pet.level,
        profile.pet.xp,
        GAME_CONFIG.FEED.XP,
      );
      const pet = await tx.pet.update({
        where: { id: profile.pet.id },
        data: {
          mood,
          hunger,
          level: xp.level,
          xp: xp.xp,
          ...(inventory.food.moodBonus > 0 ? { lastMoodAt: now } : {}),
          ...(inventory.food.hungerRestore > 0 ? { lastHungerAt: now } : {}),
          updatedAt: now,
        },
      });
      const stats = await tx.playerStatistic.update({
        where: { id: profile.stats.id },
        data: {
          totalFeeds: { increment: BigInt(1) },
        },
      });

      return this.buildActionResult({
        action: 'FEED',
        coinsEarned: BigInt(0),
        xpEarned: GAME_CONFIG.FEED.XP,
        levelsGained: xp.levelsGained,
        autoIncomeCollected: profile.autoIncomeCollected,
        pet,
        stats: mapPlayerStatistic(stats),
      });
    });

    await this.invalidateMeCache(userId);

    return result;
  }

  async click(userId: string): Promise<PetActionResultEntity> {
    const now = new Date();
    const result = await this.db.$transaction(async (tx) => {
      const profile = await this.syncProfile(tx, userId, now);
      const reward = calculateClickReward(
        profile.stats.clickPower,
        profile.pet.mood,
      );
      const xp = applyXp(
        profile.pet.level,
        profile.pet.xp,
        GAME_CONFIG.CLICK.XP,
      );
      const pet = await tx.pet.update({
        where: { id: profile.pet.id },
        data: {
          level: xp.level,
          xp: xp.xp,
          updatedAt: now,
        },
      });
      const stats = await tx.playerStatistic.update({
        where: { id: profile.stats.id },
        data: {
          coins: { increment: BigInt(reward) },
          totalCoinsEarned: { increment: BigInt(reward) },
          totalClicks: { increment: BigInt(1) },
        },
      });

      return this.buildActionResult({
        action: 'CLICK',
        coinsEarned: BigInt(reward),
        xpEarned: GAME_CONFIG.CLICK.XP,
        levelsGained: xp.levelsGained,
        autoIncomeCollected: profile.autoIncomeCollected,
        pet,
        stats: mapPlayerStatistic(stats),
      });
    });

    await this.invalidateMeCache(userId);

    return result;
  }

  async walk(userId: string): Promise<PetActionResultEntity> {
    const now = new Date();
    const result = await this.db.$transaction(async (tx) => {
      const profile = await this.syncProfile(tx, userId, now);
      const walkCooldownMs = GAME_CONFIG.WALK.COOLDOWN_SECONDS * 1000;

      if (profile.pet.lastWalkAt) {
        const elapsedMs = now.getTime() - profile.pet.lastWalkAt.getTime();

        if (elapsedMs < walkCooldownMs) {
          const seconds = Math.ceil((walkCooldownMs - elapsedMs) / 1000);

          throw new BadRequestException(PET_MESSAGES.WALK_COOLDOWN(seconds));
        }
      }

      const reward = calculateWalkReward(
        profile.stats.clickPower,
        profile.pet.mood,
      );
      const mood = clampPetStat(
        profile.pet.mood + GAME_CONFIG.WALK.MOOD_BONUS,
        GAME_CONFIG.PET.MOOD_MIN,
        GAME_CONFIG.PET.MOOD_MAX,
      );
      const hunger = clampPetStat(
        profile.pet.hunger - GAME_CONFIG.WALK.HUNGER_COST,
        GAME_CONFIG.PET.HUNGER_MIN,
        GAME_CONFIG.PET.HUNGER_MAX,
      );
      const xp = applyXp(
        profile.pet.level,
        profile.pet.xp,
        GAME_CONFIG.WALK.XP,
      );
      const pet = await tx.pet.update({
        where: { id: profile.pet.id },
        data: {
          mood,
          hunger,
          level: xp.level,
          xp: xp.xp,
          lastMoodAt: now,
          lastHungerAt: now,
          lastWalkAt: now,
          updatedAt: now,
        },
      });
      const stats = await tx.playerStatistic.update({
        where: { id: profile.stats.id },
        data: {
          coins: { increment: BigInt(reward) },
          totalCoinsEarned: { increment: BigInt(reward) },
        },
      });

      return this.buildActionResult({
        action: 'WALK',
        coinsEarned: BigInt(reward),
        xpEarned: GAME_CONFIG.WALK.XP,
        levelsGained: xp.levelsGained,
        autoIncomeCollected: profile.autoIncomeCollected,
        pet,
        stats: mapPlayerStatistic(stats),
      });
    });

    await this.invalidateMeCache(userId);

    return result;
  }

  private async syncProfile(
    tx: Prisma.TransactionClient,
    userId: string,
    now: Date,
  ): Promise<SyncedProfile> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: PROFILE_INCLUDE,
    });

    if (!user) {
      throw new NotFoundException(PET_MESSAGES.USER_NOT_FOUND);
    }

    let pet =
      user.pet ??
      (await tx.pet.create({
        data: {
          userId,
          name: this.buildDefaultPetName(user.nickname),
          updatedAt: now,
        },
      }));
    let stats =
      user.stats ??
      (await tx.playerStatistic.create({
        data: { playerId: userId },
      }));

    const decay = calculatePetDecay({
      mood: pet.mood,
      hunger: pet.hunger,
      moodUpdatedAt: pet.lastMoodAt,
      hungerUpdatedAt: pet.lastHungerAt,
      now,
    });
    const decayChanged =
      decay.mood !== pet.mood ||
      decay.hunger !== pet.hunger ||
      decay.moodUpdatedAt.getTime() !== pet.lastMoodAt.getTime() ||
      decay.hungerUpdatedAt.getTime() !== pet.lastHungerAt.getTime();

    if (decayChanged) {
      pet = await tx.pet.update({
        where: { id: pet.id },
        data: {
          mood: decay.mood,
          hunger: decay.hunger,
          lastMoodAt: decay.moodUpdatedAt,
          lastHungerAt: decay.hungerUpdatedAt,
          updatedAt: now,
        },
      });
    }

    let autoIncomeCollected = BigInt(0);

    if (stats.autoIncome > 0) {
      const elapsedMinutes = Math.floor(
        (now.getTime() - stats.lastSyncAt.getTime()) / 60_000,
      );

      if (elapsedMinutes > 0) {
        autoIncomeCollected = BigInt(stats.autoIncome) * BigInt(elapsedMinutes);
        stats = await tx.playerStatistic.update({
          where: { id: stats.id },
          data: {
            coins: { increment: autoIncomeCollected },
            totalCoinsEarned: { increment: autoIncomeCollected },
            lastSyncAt: now,
          },
        });
      }
    }

    return {
      pet,
      stats,
      autoIncomeCollected,
      changed: decayChanged || autoIncomeCollected > BigInt(0),
    };
  }

  private buildActionResult(input: ActionResultInput): PetActionResultEntity {
    return {
      action: input.action,
      actionLabel: getPetActionLabel(input.action),
      coinsEarned: input.coinsEarned.toString(),
      xpEarned: input.xpEarned,
      coinsBalance: input.stats.coins,
      totalClicks: input.stats.totalClicks,
      totalFeeds: input.stats.totalFeeds,
      leveledUp: input.levelsGained > 0,
      levelsGained: input.levelsGained,
      autoIncomeCollected: input.autoIncomeCollected.toString(),
      pet: mapPet(input.pet),
      stats: input.stats,
    };
  }

  private mapState(
    user: PetStateView,
    autoIncomeCollected: bigint,
    now: Date,
  ): PetStateEntity {
    if (!user.pet || !user.stats) {
      throw new NotFoundException(PET_MESSAGES.USER_NOT_FOUND);
    }

    return {
      pet: mapPet(user.pet),
      stats: mapPlayerStatistic(user.stats),
      foodInventory: user.foodInventories.map(mapFoodInventory),
      cosmeticInventory: user.cosmeticInventories.map(mapCosmeticInventory),
      upgrades: user.userUpgrades.map(mapUserUpgrade),
      decay: this.buildDecay(user.pet, now),
      autoIncomeCollected: autoIncomeCollected.toString(),
      serverTime: now,
    };
  }

  private buildDecay(pet: Pet, now: Date): PetDecayEntity {
    const moodRange = GAME_CONFIG.PET.MOOD_MAX - GAME_CONFIG.PET.MOOD_MIN;
    const hungerRange = GAME_CONFIG.PET.HUNGER_MAX - GAME_CONFIG.PET.HUNGER_MIN;
    const moodPerHour = moodRange / GAME_CONFIG.PET.MOOD_DECAY_HOURS;
    const hungerPerHour = hungerRange / GAME_CONFIG.PET.HUNGER_DECAY_HOURS;

    return {
      moodPerHour: Number(moodPerHour.toFixed(2)),
      hungerPerHour: Number(hungerPerHour.toFixed(2)),
      moodZeroAt:
        pet.mood <= GAME_CONFIG.PET.MOOD_MIN
          ? now
          : new Date(now.getTime() + (pet.mood / moodPerHour) * 3_600_000),
      hungerZeroAt:
        pet.hunger <= GAME_CONFIG.PET.HUNGER_MIN
          ? now
          : new Date(now.getTime() + (pet.hunger / hungerPerHour) * 3_600_000),
    };
  }

  private buildDefaultPetName(nickname: string): string {
    return `Питомец ${nickname}`.slice(0, GAME_CONFIG.PET.NAME_MAX_LENGTH);
  }

  private async invalidateMeCache(userId: string): Promise<void> {
    await this.redis.del(CACHE_KEYS.me(userId));
  }
}
