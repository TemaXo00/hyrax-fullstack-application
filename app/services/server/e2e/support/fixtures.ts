import type {
  AchievementCondition,
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

export interface AchievementFixture {
  id: string;
  code: string;
  title: string;
  description: string;
  conditionType: AchievementCondition;
  conditionValue: number;
  rewardCoins: number;
}

export const ACHIEVEMENTS: Record<
  'clicks' | 'feeds' | 'level' | 'coins' | 'streak',
  AchievementFixture
> = {
  clicks: {
    id: 'achievement-clicks',
    code: 'FIRST_CLICKS',
    title: 'Первые клики',
    description: 'Сделайте десять кликов',
    conditionType: 'TOTAL_CLICKS',
    conditionValue: 10,
    rewardCoins: 50,
  },
  feeds: {
    id: 'achievement-feeds',
    code: 'HUNGRY_PET',
    title: 'Сытный обед',
    description: 'Покормите питомца пять раз',
    conditionType: 'TOTAL_FEEDS',
    conditionValue: 5,
    rewardCoins: 100,
  },
  level: {
    id: 'achievement-level',
    code: 'GROWING_UP',
    title: 'Взросление',
    description: 'Достигните пятого уровня питомца',
    conditionType: 'LEVEL',
    conditionValue: 5,
    rewardCoins: 200,
  },
  coins: {
    id: 'achievement-coins',
    code: 'RICH_PLAYER',
    title: 'Богач',
    description: 'Заработайте тысячу монет',
    conditionType: 'TOTAL_COINS_EARNED',
    conditionValue: 1000,
    rewardCoins: 300,
  },
  streak: {
    id: 'achievement-streak',
    code: 'REGULAR_PLAYER',
    title: 'Постоянный игрок',
    description: 'Заходите три дня подряд',
    conditionType: 'STREAK',
    conditionValue: 3,
    rewardCoins: 150,
  },
};

export const ALL_ACHIEVEMENTS = Object.values(ACHIEVEMENTS);

export interface DailyRewardFixture {
  dayNumber: number;
  rewardCoins: number;
  rewardItemId: string | null;
}

export const DAILY_REWARDS: DailyRewardFixture[] = [
  { dayNumber: 1, rewardCoins: 50, rewardItemId: null },
  { dayNumber: 2, rewardCoins: 75, rewardItemId: null },
  { dayNumber: 3, rewardCoins: 100, rewardItemId: COSMETICS.cap.id },
  { dayNumber: 4, rewardCoins: 150, rewardItemId: null },
  { dayNumber: 5, rewardCoins: 200, rewardItemId: COSMETICS.background.id },
  { dayNumber: 6, rewardCoins: 250, rewardItemId: null },
  { dayNumber: 7, rewardCoins: 500, rewardItemId: null },
];
