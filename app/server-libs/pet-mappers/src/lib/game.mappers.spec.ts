import { GAME_CONFIG } from '@org/validation-config';

import {
  mapAchievement,
  mapCosmetic,
  mapCosmeticInventory,
  mapFood,
  mapFoodInventory,
  mapPet,
  mapPlayerStatistic,
  mapUpgrade,
  mapUserAchievement,
  mapUserUpgrade,
} from './game.mappers';

import type {
  AchievementRecord,
  CosmeticInventoryRecord,
  CosmeticRecord,
  FoodInventoryRecord,
  FoodRecord,
  PetRecord,
  PlayerStatisticRecord,
  UpgradeRecord,
  UserAchievementRecord,
  UserUpgradeRecord,
} from './game.mappers';

const NOW = new Date('2026-11-08T12:00:00.000Z');

function buildPet(overrides: Partial<PetRecord> = {}): PetRecord {
  return {
    id: 'pet-1',
    name: 'Барсик',
    level: 3,
    xp: 40,
    hunger: 80,
    mood: 100,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildStats(
  overrides: Partial<PlayerStatisticRecord> = {},
): PlayerStatisticRecord {
  return {
    id: 'stats-1',
    coins: 1500n,
    totalCoinsEarned: 3200n,
    totalClicks: 420n,
    totalFeeds: 18n,
    streak: 4,
    clickPower: 3,
    autoIncome: 2,
    lastSyncAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildFood(overrides: Partial<FoodRecord> = {}): FoodRecord {
  return {
    id: 'food-1',
    name: 'Морковка',
    description: 'Хрустящая',
    price: 10,
    imageUrl: null,
    isActive: true,
    hungerRestore: 15,
    moodBonus: 5,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildCosmetic(
  overrides: Partial<CosmeticRecord> = {},
): CosmeticRecord {
  return {
    id: 'cosmetic-1',
    name: 'Цилиндр',
    description: null,
    price: 250,
    imageUrl: null,
    isActive: true,
    slot: 'HAT',
    rarity: 'RARE',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildUpgrade(overrides: Partial<UpgradeRecord> = {}): UpgradeRecord {
  return {
    id: 'upgrade-1',
    name: 'Крепкая лапа',
    description: null,
    imageUrl: null,
    effectType: 'CLICK_POWER',
    effectValue: 1,
    basePrice: 100,
    priceMultiplier: 1.5,
    maxLevel: 10,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildAchievement(
  overrides: Partial<AchievementRecord> = {},
): AchievementRecord {
  return {
    id: 'achievement-1',
    code: 'TOTAL_CLICKS_1',
    title: 'Первый клик',
    description: null,
    imageUrl: null,
    conditionType: 'TOTAL_CLICKS',
    conditionValue: 1,
    rewardCoins: 100,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('game mappers', () => {
  describe('mapPet', () => {
    it('maps mood status, labels and xp threshold', () => {
      expect(mapPet(buildPet({ mood: 100 }))).toEqual({
        id: 'pet-1',
        name: 'Барсик',
        level: 3,
        xp: 40,
        xpToNextLevel:
          GAME_CONFIG.PET.XP_BASE + 2 * GAME_CONFIG.PET.XP_STEP_PER_LEVEL,
        hunger: 80,
        mood: 100,
        moodStatus: 'HAPPY',
        moodStatusLabel: 'Счастлив',
        createdAt: NOW,
        updatedAt: NOW,
      });
    });

    it('uses the sad status for a low mood', () => {
      const result = mapPet(
        buildPet({ mood: GAME_CONFIG.PET.MOOD_SAD_THRESHOLD - 1 }),
      );

      expect(result.moodStatus).toBe('SAD');
      expect(result.moodStatusLabel).toBe('Грустит');
    });
  });

  describe('mapPlayerStatistic', () => {
    it('converts bigint fields to strings', () => {
      const result = mapPlayerStatistic(buildStats());

      expect(result.coins).toBe('1500');
      expect(result.totalCoinsEarned).toBe('3200');
      expect(result.totalClicks).toBe('420');
      expect(result.totalFeeds).toBe('18');
      expect(result.streak).toBe(4);
    });
  });

  describe('food mappers', () => {
    it('maps food and its inventory record', () => {
      const food = buildFood();
      const inventory: FoodInventoryRecord = {
        id: 'inventory-1',
        quantity: 3,
        food,
        createdAt: NOW,
        updatedAt: NOW,
      };

      expect(mapFood(food)).toEqual({
        ...food,
      });
      expect(mapFoodInventory(inventory)).toEqual({
        id: 'inventory-1',
        quantity: 3,
        food: mapFood(food),
        createdAt: NOW,
        updatedAt: NOW,
      });
    });
  });

  describe('cosmetic mappers', () => {
    it('adds slot and rarity labels', () => {
      const cosmetic = buildCosmetic();
      const inventory: CosmeticInventoryRecord = {
        id: 'inventory-1',
        isEquipped: true,
        cosmetic,
        createdAt: NOW,
        updatedAt: NOW,
      };

      expect(mapCosmetic(cosmetic)).toMatchObject({
        slot: 'HAT',
        slotLabel: 'Головной убор',
        rarity: 'RARE',
        rarityLabel: 'Редкая',
      });
      expect(mapCosmeticInventory(inventory)).toEqual({
        id: 'inventory-1',
        isEquipped: true,
        cosmetic: mapCosmetic(cosmetic),
        createdAt: NOW,
        updatedAt: NOW,
      });
    });
  });

  describe('upgrade mappers', () => {
    it('converts the decimal price multiplier to a string', () => {
      const upgrade = buildUpgrade();
      const userUpgrade: UserUpgradeRecord = {
        id: 'user-upgrade-1',
        level: 2,
        upgrade,
        createdAt: NOW,
        updatedAt: NOW,
      };

      expect(mapUpgrade(upgrade)).toMatchObject({
        effectTypeLabel: 'Сила клика',
        priceMultiplier: '1.5',
      });
      expect(mapUserUpgrade(userUpgrade)).toEqual({
        id: 'user-upgrade-1',
        level: 2,
        upgrade: mapUpgrade(upgrade),
        createdAt: NOW,
        updatedAt: NOW,
      });
    });
  });

  describe('achievement mappers', () => {
    it('maps an achievement and the user achievement wrapper', () => {
      const achievement = buildAchievement();
      const userAchievement: UserAchievementRecord = {
        id: 'user-achievement-1',
        achievment: achievement,
        createdAt: NOW,
      };

      expect(mapAchievement(achievement)).toMatchObject({
        conditionType: 'TOTAL_CLICKS',
        conditionTypeLabel: 'Всего кликов',
      });
      expect(mapUserAchievement(userAchievement)).toEqual({
        id: 'user-achievement-1',
        achievement: mapAchievement(achievement),
        createdAt: NOW,
      });
    });
  });
});
