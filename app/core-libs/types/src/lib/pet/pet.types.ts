import type { CosmeticInventoryEntity } from '../cosmetic/cosmetic.types.js';
import type { FoodInventoryEntity } from '../food/food.types.js';
import type { PlayerStatisticEntity } from '../player/player-statistic.types.js';
import type { UserUpgradeEntity } from '../upgrade/upgrade.types.js';

export const PET_MOOD_STATUSES = ['HAPPY', 'NEUTRAL', 'SAD'] as const;

export type PetMoodStatus = (typeof PET_MOOD_STATUSES)[number];

export const PET_MOOD_STATUS_LABELS: Record<PetMoodStatus, string> = {
  HAPPY: 'Счастлив',
  NEUTRAL: 'Нейтральное настроение',
  SAD: 'Грустит',
};

export const getPetMoodStatusLabel = (status: PetMoodStatus): string =>
  PET_MOOD_STATUS_LABELS[status];

export const getPetMoodStatus = (
  mood: number,
  happyThreshold: number,
  sadThreshold: number,
): PetMoodStatus => {
  if (mood >= happyThreshold) {
    return 'HAPPY';
  }

  if (mood >= sadThreshold) {
    return 'NEUTRAL';
  }

  return 'SAD';
};

export const PET_ACTION_TYPES = ['CLICK', 'WALK', 'FEED'] as const;

export type PetActionType = (typeof PET_ACTION_TYPES)[number];

export const PET_ACTION_LABELS: Record<PetActionType, string> = {
  CLICK: 'Клик по питомцу',
  WALK: 'Выгул питомца',
  FEED: 'Кормление питомца',
};

export const getPetActionLabel = (action: PetActionType): string =>
  PET_ACTION_LABELS[action];

export interface PetEntity {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hunger: number;
  mood: number;
  moodStatus: PetMoodStatus;
  moodStatusLabel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PetDecayEntity {
  moodPerHour: number;
  hungerPerHour: number;
  moodZeroAt: Date;
  hungerZeroAt: Date;
}

export interface PetStateEntity {
  pet: PetEntity;
  stats: PlayerStatisticEntity;
  foodInventory: FoodInventoryEntity[];
  cosmeticInventory: CosmeticInventoryEntity[];
  upgrades: UserUpgradeEntity[];
  decay: PetDecayEntity;
  autoIncomeCollected: string;
  serverTime: Date;
}

export interface PetActionResultEntity {
  action: PetActionType;
  actionLabel: string;
  coinsEarned: string;
  xpEarned: number;
  coinsBalance: string;
  totalClicks: string;
  totalFeeds: string;
  leveledUp: boolean;
  levelsGained: number;
  autoIncomeCollected: string;
  pet: PetEntity;
  stats: PlayerStatisticEntity;
}

export interface RenamePetInput {
  name: string;
}

export interface FeedPetInput {
  foodId: string;
}
