import { GAME_CONFIG } from '@org/validation-config';

import {
  applyXp,
  calculateClickReward,
  calculatePetDecay,
  calculateUpgradePrice,
  calculateWalkReward,
  calculateXpForNextLevel,
  clampPetStat,
  getMoodMultiplier,
} from './pet-game.rules';

describe('pet-game rules', () => {
  const now = new Date('2026-11-08T12:00:00.000Z');

  describe('calculatePetDecay', () => {
    it('reduces mood to zero after the configured decay period', () => {
      const result = calculatePetDecay({
        mood: 100,
        hunger: 100,
        moodUpdatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        hungerUpdatedAt: now,
        now,
      });

      expect(result.mood).toBe(0);
      expect(result.moodDecay).toBe(100);
      expect(result.moodUpdatedAt).toEqual(now);
    });

    it('reduces mood linearly over the configured period', () => {
      const result = calculatePetDecay({
        mood: 100,
        hunger: 100,
        moodUpdatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        hungerUpdatedAt: now,
        now,
      });

      expect(result.mood).toBe(50);
      expect(result.moodDecay).toBe(50);
    });

    it('does not decay values when the stored timestamp is in the future', () => {
      const future = new Date(now.getTime() + 60 * 60 * 1000);
      const result = calculatePetDecay({
        mood: 80,
        hunger: 70,
        moodUpdatedAt: future,
        hungerUpdatedAt: future,
        now,
      });

      expect(result.mood).toBe(80);
      expect(result.hunger).toBe(70);
      expect(result.moodDecay).toBe(0);
      expect(result.hungerDecay).toBe(0);
      expect(result.moodUpdatedAt).toEqual(future);
      expect(result.hungerUpdatedAt).toEqual(future);
    });

    it('does not accumulate negative decay below zero', () => {
      const result = calculatePetDecay({
        mood: 10,
        hunger: 10,
        moodUpdatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        hungerUpdatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        now,
      });

      expect(result.mood).toBe(0);
      expect(result.hunger).toBe(0);
      expect(result.moodUpdatedAt).toEqual(now);
      expect(result.hungerUpdatedAt).toEqual(now);
    });

    it('keeps timestamps untouched while a full decay point has not accumulated', () => {
      const updatedAt = new Date(now.getTime() - 60 * 1000);
      const result = calculatePetDecay({
        mood: 100,
        hunger: 100,
        moodUpdatedAt: updatedAt,
        hungerUpdatedAt: updatedAt,
        now,
      });

      expect(result.moodDecay).toBe(0);
      expect(result.hungerDecay).toBe(0);
      expect(result.moodUpdatedAt).toEqual(updatedAt);
      expect(result.hungerUpdatedAt).toEqual(updatedAt);
    });

    it('uses the configured mood decay duration', () => {
      const result = calculatePetDecay({
        mood: GAME_CONFIG.PET.MOOD_MAX,
        hunger: GAME_CONFIG.PET.HUNGER_MAX,
        moodUpdatedAt: new Date(
          now.getTime() - GAME_CONFIG.PET.MOOD_DECAY_HOURS * 60 * 60 * 1000,
        ),
        hungerUpdatedAt: now,
        now,
      });

      expect(result.mood).toBe(GAME_CONFIG.PET.MOOD_MIN);
    });
  });

  describe('coin rewards', () => {
    it('scales click reward with mood, but never drops below one coin', () => {
      expect(calculateClickReward(10, 100)).toBe(10);
      expect(calculateClickReward(10, 50)).toBe(7);
      expect(calculateClickReward(10, 0)).toBe(5);
      expect(calculateClickReward(1, 0)).toBe(1);
    });

    it('keeps the mood multiplier inside the configured bounds', () => {
      expect(getMoodMultiplier(100)).toBe(1);
      expect(getMoodMultiplier(0)).toBe(GAME_CONFIG.CLICK.MOOD_MULTIPLIER_MIN);
      expect(getMoodMultiplier(-50)).toBe(
        GAME_CONFIG.CLICK.MOOD_MULTIPLIER_MIN,
      );
      expect(getMoodMultiplier(500)).toBe(1);
    });

    it('multiplies the walk reward by the configured multiplier', () => {
      expect(calculateWalkReward(10, 100)).toBe(
        10 * GAME_CONFIG.WALK.REWARD_MULTIPLIER,
      );
      expect(calculateWalkReward(10, 0)).toBe(
        Math.max(1, Math.floor(10 * GAME_CONFIG.CLICK.MOOD_MULTIPLIER_MIN)) *
          GAME_CONFIG.WALK.REWARD_MULTIPLIER,
      );
    });
  });

  describe('experience and levels', () => {
    it('calculates increasing xp thresholds', () => {
      expect(calculateXpForNextLevel(1)).toBe(GAME_CONFIG.PET.XP_BASE);
      expect(calculateXpForNextLevel(2)).toBe(
        GAME_CONFIG.PET.XP_BASE + GAME_CONFIG.PET.XP_STEP_PER_LEVEL,
      );
    });

    it('levels up when the threshold is reached', () => {
      const result = applyXp(1, 0, GAME_CONFIG.PET.XP_BASE);

      expect(result.level).toBe(2);
      expect(result.xp).toBe(0);
      expect(result.levelsGained).toBe(1);
    });

    it('can level up several times in one action', () => {
      const gained =
        GAME_CONFIG.PET.XP_BASE +
        (GAME_CONFIG.PET.XP_BASE + GAME_CONFIG.PET.XP_STEP_PER_LEVEL);

      const result = applyXp(1, 0, gained);

      expect(result.level).toBe(3);
      expect(result.xp).toBe(0);
      expect(result.levelsGained).toBe(2);
    });

    it('does not level up beyond the configured maximum', () => {
      const result = applyXp(
        GAME_CONFIG.PET.MAX_LEVEL,
        0,
        GAME_CONFIG.PET.XP_BASE,
      );

      expect(result.level).toBe(GAME_CONFIG.PET.MAX_LEVEL);
      expect(result.xp).toBe(0);
      expect(result.levelsGained).toBe(0);
    });
  });

  describe('upgrade price', () => {
    it('uses the base price for the first level', () => {
      expect(calculateUpgradePrice(100, 1.5, 0)).toBe(100);
    });

    it('grows geometrically with the current level', () => {
      expect(calculateUpgradePrice(100, 1.5, 1)).toBe(150);
      expect(calculateUpgradePrice(100, 1.5, 2)).toBe(225);
    });

    it('rounds the price to a whole coin', () => {
      expect(calculateUpgradePrice(100, 1.333, 1)).toBe(133);
    });
  });

  describe('clampPetStat', () => {
    it('clamps values to the allowed range', () => {
      expect(clampPetStat(-10, 0, 100)).toBe(0);
      expect(clampPetStat(110, 0, 100)).toBe(100);
      expect(clampPetStat(50, 0, 100)).toBe(50);
    });
  });
});
