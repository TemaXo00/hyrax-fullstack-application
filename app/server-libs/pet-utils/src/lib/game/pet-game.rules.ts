import { GAME_CONFIG } from '@org/validation-config';

export interface PetDecayInput {
  mood: number;
  hunger: number;
  moodUpdatedAt: Date;
  hungerUpdatedAt: Date;
  now: Date;
}

export interface PetDecayResult {
  mood: number;
  hunger: number;
  moodDecay: number;
  hungerDecay: number;
  moodUpdatedAt: Date;
  hungerUpdatedAt: Date;
}

export interface XpResult {
  level: number;
  xp: number;
  levelsGained: number;
}

interface DecayValueResult {
  value: number;
  decay: number;
  updatedAt: Date;
}

const HOUR_IN_MS = 60 * 60 * 1000;

export function calculatePetDecay(input: PetDecayInput): PetDecayResult {
  const mood = calculateDecayValue(
    input.mood,
    GAME_CONFIG.PET.MOOD_MIN,
    GAME_CONFIG.PET.MOOD_MAX,
    input.moodUpdatedAt,
    input.now,
    GAME_CONFIG.PET.MOOD_DECAY_HOURS,
  );
  const hunger = calculateDecayValue(
    input.hunger,
    GAME_CONFIG.PET.HUNGER_MIN,
    GAME_CONFIG.PET.HUNGER_MAX,
    input.hungerUpdatedAt,
    input.now,
    GAME_CONFIG.PET.HUNGER_DECAY_HOURS,
  );

  return {
    mood: mood.value,
    hunger: hunger.value,
    moodDecay: mood.decay,
    hungerDecay: hunger.decay,
    moodUpdatedAt: mood.updatedAt,
    hungerUpdatedAt: hunger.updatedAt,
  };
}

export function getMoodMultiplier(mood: number): number {
  const normalizedMood = clampPetStat(
    mood,
    GAME_CONFIG.PET.MOOD_MIN,
    GAME_CONFIG.PET.MOOD_MAX,
  );
  const moodRatio =
    normalizedMood / (GAME_CONFIG.PET.MOOD_MAX - GAME_CONFIG.PET.MOOD_MIN);
  const minimumMultiplier = GAME_CONFIG.CLICK.MOOD_MULTIPLIER_MIN;

  return minimumMultiplier + (1 - minimumMultiplier) * moodRatio;
}

export function calculateClickReward(clickPower: number, mood: number): number {
  return Math.max(1, Math.floor(clickPower * getMoodMultiplier(mood)));
}

export function calculateWalkReward(clickPower: number, mood: number): number {
  return (
    calculateClickReward(clickPower, mood) * GAME_CONFIG.WALK.REWARD_MULTIPLIER
  );
}

export function calculateXpForNextLevel(level: number): number {
  const safeLevel = Math.max(1, level);

  return (
    GAME_CONFIG.PET.XP_BASE +
    (safeLevel - 1) * GAME_CONFIG.PET.XP_STEP_PER_LEVEL
  );
}

export function applyXp(level: number, xp: number, gainedXp: number): XpResult {
  let nextLevel = Math.max(1, level);
  let nextXp = Math.max(0, xp) + Math.max(0, gainedXp);
  let levelsGained = 0;

  while (nextLevel < GAME_CONFIG.PET.MAX_LEVEL) {
    const threshold = calculateXpForNextLevel(nextLevel);

    if (nextXp < threshold) {
      break;
    }

    nextXp -= threshold;
    nextLevel += 1;
    levelsGained += 1;
  }

  if (nextLevel >= GAME_CONFIG.PET.MAX_LEVEL) {
    nextXp = 0;
  }

  return {
    level: nextLevel,
    xp: nextXp,
    levelsGained,
  };
}

export function calculateUpgradePrice(
  basePrice: number,
  priceMultiplier: number,
  currentLevel: number,
): number {
  const safeLevel = Math.max(0, currentLevel);
  const safeMultiplier =
    Number.isFinite(priceMultiplier) && priceMultiplier > 0
      ? priceMultiplier
      : 1;

  return Math.round(basePrice * safeMultiplier ** safeLevel);
}

export function clampPetStat(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function calculateDecayValue(
  currentValue: number,
  minValue: number,
  maxValue: number,
  updatedAt: Date,
  now: Date,
  decayHours: number,
): DecayValueResult {
  const safeCurrentValue = clampPetStat(currentValue, minValue, maxValue);

  if (safeCurrentValue <= minValue) {
    return {
      value: minValue,
      decay: 0,
      updatedAt: now,
    };
  }

  const elapsedMs = now.getTime() - updatedAt.getTime();

  if (elapsedMs <= 0 || decayHours <= 0) {
    return {
      value: safeCurrentValue,
      decay: 0,
      updatedAt,
    };
  }

  const valuePerHour = (maxValue - minValue) / decayHours;
  const rawDecay = (elapsedMs / HOUR_IN_MS) * valuePerHour;
  const decay = Math.floor(rawDecay);

  if (decay <= 0) {
    return {
      value: safeCurrentValue,
      decay: 0,
      updatedAt,
    };
  }

  const value = Math.max(minValue, safeCurrentValue - decay);
  const actualDecay = safeCurrentValue - value;

  if (value <= minValue) {
    return {
      value: minValue,
      decay: actualDecay,
      updatedAt: now,
    };
  }

  const consumedMs = (actualDecay / valuePerHour) * HOUR_IN_MS;

  return {
    value,
    decay: actualDecay,
    updatedAt: new Date(updatedAt.getTime() + consumedMs),
  };
}
