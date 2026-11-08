import type { PaginationMeta } from '../shared/pagination.types.js';

export const COSMETIC_SLOTS = ['HAT', 'BACKGROUND', 'ACCESSORY'] as const;

export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];

export const COSMETIC_SLOT_LABELS: Record<CosmeticSlot, string> = {
  HAT: 'Головной убор',
  BACKGROUND: 'Фон',
  ACCESSORY: 'Аксессуар',
};

export const COSMETIC_SLOT_OPTIONS = COSMETIC_SLOTS.map(
  (slot) => COSMETIC_SLOT_LABELS[slot],
).join(', ');

export const getCosmeticSlotLabel = (slot: CosmeticSlot): string =>
  COSMETIC_SLOT_LABELS[slot];

export const COSMETIC_RARITIES = ['COMMON', 'RARE', 'EPIC'] as const;

export type CosmeticRarity = (typeof COSMETIC_RARITIES)[number];

export const COSMETIC_RARITY_LABELS: Record<CosmeticRarity, string> = {
  COMMON: 'Обычная',
  RARE: 'Редкая',
  EPIC: 'Эпическая',
};

export const COSMETIC_RARITY_OPTIONS = COSMETIC_RARITIES.map(
  (rarity) => COSMETIC_RARITY_LABELS[rarity],
).join(', ');

export const getCosmeticRarityLabel = (rarity: CosmeticRarity): string =>
  COSMETIC_RARITY_LABELS[rarity];

export interface CosmeticEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  slot: CosmeticSlot;
  slotLabel: string;
  rarity: CosmeticRarity;
  rarityLabel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CosmeticInventoryEntity {
  id: string;
  isEquipped: boolean;
  cosmetic: CosmeticEntity;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipCosmeticInput {
  equipped: boolean;
}

export interface CosmeticPurchaseEntity {
  inventory: CosmeticInventoryEntity;
  spentCoins: string;
  coinsBalance: string;
}

export interface PaginatedCosmeticsOutput {
  pagination: PaginationMeta;
  cosmetics: CosmeticEntity[];
}
