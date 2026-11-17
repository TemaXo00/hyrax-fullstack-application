import type {
  CosmeticRarity,
  CosmeticSlot,
  UpgradeEffectType,
} from '@org/types';

export const E2E_PASSWORD = 'Secret123';

export interface FoodFixture {
  id: string;
  name: string;
  description: string;
  price: number;
  hungerRestore: number;
  moodBonus: number;
  isActive: boolean;
}

export interface CosmeticFixture {
  id: string;
  name: string;
  description: string;
  price: number;
  slot: CosmeticSlot;
  rarity: CosmeticRarity;
  isActive: boolean;
}

export interface UpgradeFixture {
  id: string;
  name: string;
  description: string;
  effectType: UpgradeEffectType;
  effectValue: number;
  basePrice: number;
  priceMultiplier: number;
  maxLevel: number;
}

export const FOODS: Record<'carrot' | 'apple' | 'inactive', FoodFixture> = {
  carrot: {
    id: 'food-carrot',
    name: 'Морковка',
    description: 'Хрустящая морковка',
    price: 10,
    hungerRestore: 15,
    moodBonus: 2,
    isActive: true,
  },
  apple: {
    id: 'food-apple',
    name: 'Яблоко',
    description: 'Сочное яблоко',
    price: 25,
    hungerRestore: 30,
    moodBonus: 5,
    isActive: true,
  },
  inactive: {
    id: 'food-inactive',
    name: 'Секретный суп',
    description: 'Недоступен для покупки',
    price: 999,
    hungerRestore: 100,
    moodBonus: 100,
    isActive: false,
  },
};

export const COSMETICS: Record<
  'cap' | 'background' | 'inactive',
  CosmeticFixture
> = {
  cap: {
    id: 'cosmetic-cap',
    name: 'Кепка',
    description: 'Простая кепка',
    price: 50,
    slot: 'HAT',
    rarity: 'COMMON',
    isActive: true,
  },
  background: {
    id: 'cosmetic-background',
    name: 'Закат',
    description: 'Тёплый фон',
    price: 200,
    slot: 'BACKGROUND',
    rarity: 'RARE',
    isActive: true,
  },
  inactive: {
    id: 'cosmetic-inactive',
    name: 'Легендарные очки',
    description: 'Недоступны для покупки',
    price: 500,
    slot: 'ACCESSORY',
    rarity: 'EPIC',
    isActive: false,
  },
};

export const UPGRADES: Record<'click' | 'auto', UpgradeFixture> = {
  click: {
    id: 'upgrade-click',
    name: 'Сила клика',
    description: 'Увеличивает награду за клик',
    effectType: 'CLICK_POWER',
    effectValue: 1,
    basePrice: 100,
    priceMultiplier: 1.5,
    maxLevel: 3,
  },
  auto: {
    id: 'upgrade-auto',
    name: 'Пассивный доход',
    description: 'Начисляет монеты со временем',
    effectType: 'AUTO_INCOME',
    effectValue: 2,
    basePrice: 200,
    priceMultiplier: 2,
    maxLevel: 2,
  },
};

export const ACTIVE_FOODS = [FOODS.carrot, FOODS.apple];
export const ACTIVE_COSMETICS = [COSMETICS.cap, COSMETICS.background];
export const ALL_UPGRADES = [UPGRADES.click, UPGRADES.auto];
