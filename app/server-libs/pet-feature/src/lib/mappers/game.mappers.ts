import {
  getAchievementConditionLabel,
  getCosmeticRarityLabel,
  getCosmeticSlotLabel,
  getPetMoodStatus,
  getPetMoodStatusLabel,
  getUpgradeEffectLabel,
} from '@org/types';
import { GAME_CONFIG } from '@org/validation-config';

import { calculateXpForNextLevel } from '../game/pet-game.rules';

import type {
  AchievementEntity,
  CosmeticEntity,
  CosmeticInventoryEntity,
  CosmeticRarity,
  CosmeticSlot,
  FoodEntity,
  FoodInventoryEntity,
  PetEntity,
  PlayerStatisticEntity,
  UpgradeEffectType,
  UpgradeEntity,
  UserAchievementEntity,
  UserUpgradeEntity,
} from '@org/types';

export interface PetRecord {
  id: string;
  name: string;
  level: number;
  xp: number;
  hunger: number;
  mood: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStatisticRecord {
  id: string;
  coins: bigint;
  totalCoinsEarned: bigint;
  totalClicks: bigint;
  totalFeeds: bigint;
  streak: number;
  clickPower: number;
  autoIncome: number;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  hungerRestore: number;
  moodBonus: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodInventoryRecord {
  id: string;
  quantity: number;
  food: FoodRecord;
  createdAt: Date;
  updatedAt: Date;
}

export interface CosmeticRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  slot: CosmeticSlot;
  rarity: CosmeticRarity;
  createdAt: Date;
  updatedAt: Date;
}

export interface CosmeticInventoryRecord {
  id: string;
  isEquipped: boolean;
  cosmetic: CosmeticRecord;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpgradeRecord {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  effectType: UpgradeEffectType;
  effectValue: number;
  basePrice: number;
  priceMultiplier: unknown;
  maxLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpgradeRecord {
  id: string;
  level: number;
  upgrade: UpgradeRecord;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementRecord {
  id: string;
  code: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  conditionType: AchievementEntity['conditionType'];
  conditionValue: number;
  rewardCoins: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievementRecord {
  id: string;
  achievment: AchievementRecord;
  createdAt: Date;
}

export function mapPet(pet: PetRecord): PetEntity {
  const moodStatus = getPetMoodStatus(
    pet.mood,
    GAME_CONFIG.PET.MOOD_HAPPY_THRESHOLD,
    GAME_CONFIG.PET.MOOD_SAD_THRESHOLD,
  );

  return {
    id: pet.id,
    name: pet.name,
    level: pet.level,
    xp: pet.xp,
    xpToNextLevel: calculateXpForNextLevel(pet.level),
    hunger: pet.hunger,
    mood: pet.mood,
    moodStatus,
    moodStatusLabel: getPetMoodStatusLabel(moodStatus),
    createdAt: pet.createdAt,
    updatedAt: pet.updatedAt,
  };
}

export function mapPlayerStatistic(
  stats: PlayerStatisticRecord,
): PlayerStatisticEntity {
  return {
    id: stats.id,
    coins: stats.coins.toString(),
    totalCoinsEarned: stats.totalCoinsEarned.toString(),
    totalClicks: stats.totalClicks.toString(),
    totalFeeds: stats.totalFeeds.toString(),
    streak: stats.streak,
    clickPower: stats.clickPower,
    autoIncome: stats.autoIncome,
    lastSyncAt: stats.lastSyncAt,
    createdAt: stats.createdAt,
    updatedAt: stats.updatedAt,
  };
}

export function mapFood(food: FoodRecord): FoodEntity {
  return {
    id: food.id,
    name: food.name,
    description: food.description,
    price: food.price,
    imageUrl: food.imageUrl,
    isActive: food.isActive,
    hungerRestore: food.hungerRestore,
    moodBonus: food.moodBonus,
    createdAt: food.createdAt,
    updatedAt: food.updatedAt,
  };
}

export function mapFoodInventory(
  item: FoodInventoryRecord,
): FoodInventoryEntity {
  return {
    id: item.id,
    quantity: item.quantity,
    food: mapFood(item.food),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function mapCosmetic(cosmetic: CosmeticRecord): CosmeticEntity {
  return {
    id: cosmetic.id,
    name: cosmetic.name,
    description: cosmetic.description,
    price: cosmetic.price,
    imageUrl: cosmetic.imageUrl,
    isActive: cosmetic.isActive,
    slot: cosmetic.slot,
    slotLabel: getCosmeticSlotLabel(cosmetic.slot),
    rarity: cosmetic.rarity,
    rarityLabel: getCosmeticRarityLabel(cosmetic.rarity),
    createdAt: cosmetic.createdAt,
    updatedAt: cosmetic.updatedAt,
  };
}

export function mapCosmeticInventory(
  item: CosmeticInventoryRecord,
): CosmeticInventoryEntity {
  return {
    id: item.id,
    isEquipped: item.isEquipped,
    cosmetic: mapCosmetic(item.cosmetic),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function mapUpgrade(upgrade: UpgradeRecord): UpgradeEntity {
  return {
    id: upgrade.id,
    name: upgrade.name,
    description: upgrade.description,
    imageUrl: upgrade.imageUrl,
    effectType: upgrade.effectType,
    effectTypeLabel: getUpgradeEffectLabel(upgrade.effectType),
    effectValue: upgrade.effectValue,
    basePrice: upgrade.basePrice,
    priceMultiplier: String(upgrade.priceMultiplier),
    maxLevel: upgrade.maxLevel,
    createdAt: upgrade.createdAt,
    updatedAt: upgrade.updatedAt,
  };
}

export function mapUserUpgrade(item: UserUpgradeRecord): UserUpgradeEntity {
  return {
    id: item.id,
    level: item.level,
    upgrade: mapUpgrade(item.upgrade),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function mapAchievement(
  achievement: AchievementRecord,
): AchievementEntity {
  return {
    id: achievement.id,
    code: achievement.code,
    title: achievement.title,
    description: achievement.description,
    imageUrl: achievement.imageUrl,
    conditionType: achievement.conditionType,
    conditionTypeLabel: getAchievementConditionLabel(achievement.conditionType),
    conditionValue: achievement.conditionValue,
    rewardCoins: achievement.rewardCoins,
    createdAt: achievement.createdAt,
    updatedAt: achievement.updatedAt,
  };
}

export function mapUserAchievement(
  item: UserAchievementRecord,
): UserAchievementEntity {
  return {
    id: item.id,
    achievement: mapAchievement(item.achievment),
    createdAt: item.createdAt,
  };
}
