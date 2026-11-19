import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getApiErrorMessage } from '../http';
import {
  clickPet,
  feedPet,
  getPetState,
  renamePet,
  walkPet,
} from '../pet.api';
import {
  readStoredNumber,
  readStoredString,
  writeStoredNumber,
  writeStoredString,
} from '../storage';
import { useUiStore } from './ui.store';

import type { PetActionResult, PetState } from '../pet.api';

export const PET_SPECIES = ['hyrax', 'guinea-pig'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_SPECIES_META: Record<
  PetSpecies,
  { label: string; image: string; note: string }
> = {
  hyrax: {
    label: 'Даман',
    image: '/pets/hyrax.png',
    note: 'Любит тёплые камни, тишину и немного солнца.',
  },
  'guinea-pig': {
    label: 'Морская свинка',
    image: '/pets/guinea-pig.png',
    note: 'Любит траву, свежие овощи и внимание.',
  },
};

const PENDING_CLICKS_KEY = 'hyrax.pet.pendingClicks';
const WALK_READY_AT_KEY = 'hyrax.pet.walkReadyAt';
const SPECIES_KEY = 'hyrax.pet.species';

const CLICK_WINDOW_MS = 10_000;
const CLICK_WINDOW_LIMIT = 24;
const WALK_COOLDOWN_MS = 30_000;
const MAX_PENDING_CLICKS = 1000;

type BusyAction = 'walk' | 'feed' | 'rename' | 'load' | null;

function isSpecies(value: string): value is PetSpecies {
  return PET_SPECIES.includes(value as PetSpecies);
}

export const usePetStore = defineStore('pet', () => {
  const state = ref<PetState | null>(null);
  const loading = ref(false);
  const busyAction = ref<BusyAction>(null);
  const error = ref<string | null>(null);

  const pendingClicks = ref(readStoredNumber(PENDING_CLICKS_KEY, 0));
  const walkReadyAt = ref(readStoredNumber(WALK_READY_AT_KEY, 0));
  const storedSpecies = readStoredString(SPECIES_KEY, 'hyrax');
  const species = ref<PetSpecies>(
    isSpecies(storedSpecies) ? storedSpecies : 'hyrax',
  );
  const clickTimes = ref<number[]>([]);
  let clickChain: Promise<void> = Promise.resolve();

  const pet = computed(() => state.value?.pet ?? null);
  const stats = computed(() => state.value?.stats ?? null);
  const coins = computed(() => Number(stats.value?.coins ?? 0));
  const mood = computed(() => pet.value?.mood ?? 0);
  const hunger = computed(() => pet.value?.hunger ?? 0);
  const level = computed(() => pet.value?.level ?? 1);
  const xp = computed(() => pet.value?.xp ?? 0);
  const xpToNextLevel = computed(() => pet.value?.xpToNextLevel ?? 100);
  const clickPower = computed(() => stats.value?.clickPower ?? 1);
  const autoIncome = computed(() => stats.value?.autoIncome ?? 0);
  const foodInventory = computed(() => state.value?.foodInventory ?? []);
  const cosmeticInventory = computed(
    () => state.value?.cosmeticInventory ?? [],
  );
  const userUpgrades = computed(() => state.value?.upgrades ?? []);
  const decay = computed(() => state.value?.decay ?? null);
  const speciesMeta = computed(() => PET_SPECIES_META[species.value]);
  const isBusy = computed(() => busyAction.value !== null);

  const xpPercent = computed(() =>
    Math.min(100, Math.max(0, (xp.value / Math.max(1, xpToNextLevel.value)) * 100)),
  );

  const moodPercent = computed(() => Math.min(100, Math.max(0, mood.value)));
  const hungerPercent = computed(() => Math.min(100, Math.max(0, hunger.value)));

  const moodMultiplier = computed(() => 0.5 + 0.5 * (moodPercent.value / 100));
  const clickReward = computed(() =>
    Math.max(1, Math.floor(clickPower.value * moodMultiplier.value)),
  );

  const equippedBackground = computed(
    () =>
      cosmeticInventory.value.find(
        (item) => item.isEquipped && item.cosmetic.slot === 'BACKGROUND',
      )?.cosmetic ?? null,
  );

  const equippedHat = computed(
    () =>
      cosmeticInventory.value.find(
        (item) => item.isEquipped && item.cosmetic.slot === 'HAT',
      )?.cosmetic ?? null,
  );

  const equippedAccessory = computed(
    () =>
      cosmeticInventory.value.find(
        (item) => item.isEquipped && item.cosmetic.slot === 'ACCESSORY',
      )?.cosmetic ?? null,
  );

  function setPendingClicks(value: number): void {
    pendingClicks.value = Math.min(MAX_PENDING_CLICKS, Math.max(0, value));
    writeStoredNumber(PENDING_CLICKS_KEY, pendingClicks.value);
  }

  function setWalkReadyAt(value: number): void {
    walkReadyAt.value = value;
    writeStoredNumber(WALK_READY_AT_KEY, value);
  }

  function remainingWalkCooldown(now = Date.now()): number {
    return Math.max(0, Math.ceil((walkReadyAt.value - now) / 1000));
  }

  function isWalkReady(now = Date.now()): boolean {
    return pendingClicks.value > 0 && remainingWalkCooldown(now) === 0;
  }

  function clickLimitLeft(now = Date.now()): number {
    const recent = clickTimes.value.filter((time) => now - time < CLICK_WINDOW_MS);

    return Math.max(0, CLICK_WINDOW_LIMIT - recent.length);
  }

  function applyActionResult(result: PetActionResult): void {
    if (!state.value) {
      return;
    }

    state.value.pet = result.pet;
    state.value.stats = result.stats;
  }

  async function loadState(options: { silent?: boolean } = {}): Promise<void> {
    if (!options.silent) {
      loading.value = true;
    }

    try {
      state.value = await getPetState();
      error.value = null;
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
      useUiStore().fail(error.value);
    } finally {
      loading.value = false;
    }
  }

  async function performClick(): Promise<void> {
    try {
      const result = await clickPet();

      applyActionResult(result);
      setPendingClicks(pendingClicks.value + 1);
      error.value = null;

      if (result.leveledUp) {
        useUiStore().notify(`Новый уровень: ${result.pet.level}`);
      }
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
      useUiStore().fail(error.value);
    }
  }

  function click(): Promise<void> {
    const now = Date.now();
    const recent = clickTimes.value.filter(
      (time) => now - time < CLICK_WINDOW_MS,
    );

    if (recent.length >= CLICK_WINDOW_LIMIT) {
      useUiStore().fail('Питомец устал от ласки. Подождите пару секунд.');

      return Promise.resolve();
    }

    clickTimes.value = [...recent, now];
    clickChain = clickChain.then(performClick);

    return clickChain;
  }

  async function walk(): Promise<void> {
    if (pendingClicks.value < 1) {
      useUiStore().fail('Сначала погладьте питомца, чтобы накопить клики.');

      return;
    }

    if (remainingWalkCooldown() > 0) {
      useUiStore().fail(
        `Питомец ещё отдыхает: ${remainingWalkCooldown()} с.`,
      );

      return;
    }

    busyAction.value = 'walk';

    try {
      const result = await walkPet(pendingClicks.value);

      applyActionResult(result);
      setPendingClicks(0);
      setWalkReadyAt(Date.now() + WALK_COOLDOWN_MS);
      useUiStore().notify(
        `Прогулка: +${Number(result.coinsEarned)} монет, настроение выше.`,
      );
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
      useUiStore().fail(error.value);
    } finally {
      busyAction.value = null;
    }
  }

  async function feed(foodId: string): Promise<void> {
    busyAction.value = 'feed';

    try {
      const result = await feedPet(foodId);

      applyActionResult(result);
      await loadState({ silent: true });
      useUiStore().notify('Питомец сыт и доволен.');
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
      useUiStore().fail(error.value);
    } finally {
      busyAction.value = null;
    }
  }

  async function rename(name: string): Promise<boolean> {
    busyAction.value = 'rename';

    try {
      const updated = await renamePet(name);

      if (state.value) {
        state.value.pet = updated;
      }

      useUiStore().notify('Имя питомца обновлено.');
      return true;
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
      useUiStore().fail(error.value);
      return false;
    } finally {
      busyAction.value = null;
    }
  }

  function setSpecies(next: PetSpecies): void {
    species.value = next;
    writeStoredString(SPECIES_KEY, next);
  }

  function reset(): void {
    state.value = null;
    error.value = null;
    loading.value = false;
    busyAction.value = null;
    clickTimes.value = [];
    clickChain = Promise.resolve();
    setPendingClicks(0);
    setWalkReadyAt(0);
  }

  return {
    state,
    pet,
    stats,
    coins,
    mood,
    hunger,
    level,
    xp,
    xpToNextLevel,
    clickPower,
    autoIncome,
    foodInventory,
    cosmeticInventory,
    userUpgrades,
    decay,
    loading,
    busyAction,
    error,
    pendingClicks,
    walkReadyAt,
    species,
    speciesMeta,
    isBusy,
    xpPercent,
    moodPercent,
    hungerPercent,
    moodMultiplier,
    clickReward,
    equippedBackground,
    equippedHat,
    equippedAccessory,
    loadState,
    click,
    walk,
    feed,
    rename,
    setSpecies,
    setPendingClicks,
    setWalkReadyAt,
    remainingWalkCooldown,
    isWalkReady,
    clickLimitLeft,
    reset,
  };
});
