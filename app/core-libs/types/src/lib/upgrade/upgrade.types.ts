import type { PaginationMeta } from '../shared/pagination.types.js';

export const UPGRADE_EFFECT_TYPES = ['CLICK_POWER', 'AUTO_INCOME'] as const;

export type UpgradeEffectType = (typeof UPGRADE_EFFECT_TYPES)[number];

export const UPGRADE_EFFECT_LABELS: Record<UpgradeEffectType, string> = {
  CLICK_POWER: 'Сила клика',
  AUTO_INCOME: 'Пассивный доход',
};

export const UPGRADE_EFFECT_OPTIONS = UPGRADE_EFFECT_TYPES.map(
  (effect) => UPGRADE_EFFECT_LABELS[effect],
).join(', ');

export const getUpgradeEffectLabel = (effect: UpgradeEffectType): string =>
  UPGRADE_EFFECT_LABELS[effect];

export interface UpgradeEntity {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  effectType: UpgradeEffectType;
  effectTypeLabel: string;
  effectValue: number;
  basePrice: number;
  priceMultiplier: string;
  maxLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpgradeEntity {
  id: string;
  level: number;
  upgrade: UpgradeEntity;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpgradeShopEntity extends UpgradeEntity {
  ownedLevel: number;
  nextLevelPrice: number;
  isMaxLevel: boolean;
}

export interface BuyUpgradeInput {
  upgradeId: string;
}

export interface UpgradePurchaseEntity {
  userUpgrade: UserUpgradeEntity;
  spentCoins: string;
  coinsBalance: string;
}

export interface PaginatedUpgradesOutput {
  pagination: PaginationMeta;
  upgrades: UpgradeShopEntity[];
}
