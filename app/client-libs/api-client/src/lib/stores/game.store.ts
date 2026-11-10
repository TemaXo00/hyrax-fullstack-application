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
  buyCosmetic,
  buyFood,
  buyUpgrade,
  equipCosmetic,
  getCosmetics,
  getFoods,
  getUpgrades,
} from '../shop.api';

import type { PetActionResult, PetState } from '../pet.api';
import type {
  PaginatedCosmetics,
  PaginatedFoods,
  PaginatedUpgrades,
} from '../shop.api';
import type { Serialized } from '../types';
import type {
  CosmeticEntity,
  FoodEntity,
  PaginationMeta,
  UpgradeShopEntity,
} from '@org/types';

export type Food = Serialized<FoodEntity>;
export type Cosmetic = Serialized<CosmeticEntity>;
export type UpgradeShop = Serialized<UpgradeShopEntity>;

type ActionName =
  | 'click'
  | 'walk'
  | 'feed'
  | 'rename'
  | 'buy-food'
  | 'buy-cosmetic'
  | 'equip-cosmetic'
  | 'buy-upgrade';

interface LoadStateOptions {
  silent?: boolean;
}

function buildPagination(page: number, search: string): {
  page: number;
  limit: number;
  search?: string;
} {
  const normalizedSearch = search.trim();

  return {
    page,
    limit: 8,
    ...(normalizedSearch.length >= 3 ? { search: normalizedSearch } : {}),
  };
}

export const useGameStore = defineStore('game', () => {
  const state = ref<PetState | null>(null);
  const lastAction = ref<PetActionResult | null>(null);

  const loading = ref(false);
  const actionLoading = ref<ActionName | null>(null);
  const error = ref<string | null>(null);
  const notice = ref<string | null>(null);

  const foods = ref<Food[]>([]);
  const foodPagination = ref<PaginationMeta | null>(null);
  const foodsLoading = ref(false);
  const foodSearch = ref('');
  const foodPage = ref(1);

  const cosmetics = ref<Cosmetic[]>([]);
  const cosmeticPagination = ref<PaginationMeta | null>(null);
  const cosmeticsLoading = ref(false);
  const cosmeticSearch = ref('');
  const cosmeticPage = ref(1);

  const upgrades = ref<UpgradeShop[]>([]);
  const upgradePagination = ref<PaginationMeta | null>(null);
  const upgradesLoading = ref(false);
  const upgradeSearch = ref('');
  const upgradePage = ref(1);

  const pet = computed(() => state.value?.pet ?? null);
  const stats = computed(() => state.value?.stats ?? null);
  const coins = computed(() => Number(stats.value?.coins ?? 0));
  const foodInventory = computed(() => state.value?.foodInventory ?? []);
  const cosmeticInventory = computed(() => state.value?.cosmeticInventory ?? []);
  const userUpgrades = computed(() => state.value?.upgrades ?? []);
  const decay = computed(() => state.value?.decay ?? null);

  function applyActionResult(result: PetActionResult): void {
    lastAction.value = result;

    if (!state.value) {
      return;
    }

    state.value.pet = result.pet;
    state.value.stats = result.stats;
  }

  function buildRewardNotice(result: PetActionResult): string {
    const parts = [
      `${result.actionLabel}: +${result.coinsEarned} монет`,
      `+${result.xpEarned} XP`,
    ];

    if (result.leveledUp) {
      parts.push(`новый уровень: ${result.levelsGained}`);
    }

    if (Number(result.autoIncomeCollected) > 0) {
      parts.push(`пассивный доход: +${result.autoIncomeCollected}`);
    }

    return parts.join(', ');
  }

  async function loadState(options: LoadStateOptions = {}): Promise<void> {
    if (!options.silent) {
      loading.value = true;
    }

    try {
      state.value = await getPetState();
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
    } finally {
      if (!options.silent) {
        loading.value = false;
      }
    }
  }

  async function runAction<T>(
    name: ActionName,
    action: () => Promise<T>,
    onSuccess?: (result: T) => Promise<void> | void,
  ): Promise<T | null> {
    actionLoading.value = name;
    error.value = null;
    notice.value = null;

    try {
      const result = await action();

      await onSuccess?.(result);

      return result;
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);

      return null;
    } finally {
      actionLoading.value = null;
    }
  }

  async function click(): Promise<void> {
    const result = await runAction('click', clickPet);

    if (result) {
      applyActionResult(result);
      notice.value = buildRewardNotice(result);
    }
  }

  async function walk(): Promise<void> {
    const result = await runAction('walk', walkPet);

    if (result) {
      applyActionResult(result);
      notice.value = buildRewardNotice(result);
    }
  }

  async function feed(foodId: string): Promise<void> {
    const result = await runAction('feed', async () => await feedPet(foodId));

    if (result) {
      applyActionResult(result);
      notice.value = buildRewardNotice(result);
      await loadState({ silent: true });
    }
  }

  async function rename(name: string): Promise<void> {
    const result = await runAction('rename', async () => await renamePet(name));

    if (result) {
      if (state.value) {
        state.value.pet = result;
      }

      notice.value = `Питомец теперь зовётся «${result.name}»`;
    }
  }

  async function buyFoodItem(foodId: string, quantity = 1): Promise<void> {
    const result = await runAction(
      'buy-food',
      async () => await buyFood(foodId, quantity),
    );

    if (result) {
      notice.value = `Куплено ${result.inventory.quantity} шт. «${result.inventory.food.name}» за ${result.spentCoins} монет`;
      await loadState({ silent: true });
    }
  }

  async function buyCosmeticItem(cosmeticId: string): Promise<void> {
    const result = await runAction(
      'buy-cosmetic',
      async () => await buyCosmetic(cosmeticId),
    );

    if (result) {
      notice.value = `Куплено «${result.inventory.cosmetic.name}» за ${result.spentCoins} монет`;
      await loadState({ silent: true });
    }
  }

  async function equipCosmeticItem(
    cosmeticId: string,
    equipped: boolean,
  ): Promise<void> {
    const result = await runAction(
      'equip-cosmetic',
      async () => await equipCosmetic(cosmeticId, equipped),
    );

    if (result) {
      notice.value = result.isEquipped
        ? `Экипировано «${result.cosmetic.name}»`
        : `Снято «${result.cosmetic.name}»`;
      await loadState({ silent: true });
    }
  }

  async function buyUpgradeItem(upgradeId: string): Promise<void> {
    const result = await runAction(
      'buy-upgrade',
      async () => await buyUpgrade(upgradeId),
    );

    if (result) {
      notice.value = `Улучшение «${result.userUpgrade.upgrade.name}» теперь уровня ${result.userUpgrade.level} (потрачено ${result.spentCoins})`;
      await Promise.all([loadState({ silent: true }), loadUpgrades()]);
    }
  }

  async function loadFoods(): Promise<void> {
    foodsLoading.value = true;

    try {
      const result: PaginatedFoods = await getFoods(
        buildPagination(foodPage.value, foodSearch.value),
      );

      foods.value = result.foods;
      foodPagination.value = result.pagination;
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
    } finally {
      foodsLoading.value = false;
    }
  }

  async function loadCosmetics(): Promise<void> {
    cosmeticsLoading.value = true;

    try {
      const result: PaginatedCosmetics = await getCosmetics(
        buildPagination(cosmeticPage.value, cosmeticSearch.value),
      );

      cosmetics.value = result.cosmetics;
      cosmeticPagination.value = result.pagination;
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
    } finally {
      cosmeticsLoading.value = false;
    }
  }

  async function loadUpgrades(): Promise<void> {
    upgradesLoading.value = true;

    try {
      const result: PaginatedUpgrades = await getUpgrades(
        buildPagination(upgradePage.value, upgradeSearch.value),
      );

      upgrades.value = result.upgrades;
      upgradePagination.value = result.pagination;
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
    } finally {
      upgradesLoading.value = false;
    }
  }

  async function searchFoods(): Promise<void> {
    foodPage.value = 1;
    await loadFoods();
  }

  async function searchCosmetics(): Promise<void> {
    cosmeticPage.value = 1;
    await loadCosmetics();
  }

  async function searchUpgrades(): Promise<void> {
    upgradePage.value = 1;
    await loadUpgrades();
  }

  function clearMessages(): void {
    error.value = null;
    notice.value = null;
  }

  function reset(): void {
    state.value = null;
    lastAction.value = null;
    error.value = null;
    notice.value = null;
    foods.value = [];
    foodPagination.value = null;
    foodSearch.value = '';
    foodPage.value = 1;
    cosmetics.value = [];
    cosmeticPagination.value = null;
    cosmeticSearch.value = '';
    cosmeticPage.value = 1;
    upgrades.value = [];
    upgradePagination.value = null;
    upgradeSearch.value = '';
    upgradePage.value = 1;
  }

  return {
    state,
    lastAction,
    loading,
    actionLoading,
    error,
    notice,
    foods,
    foodPagination,
    foodsLoading,
    foodSearch,
    foodPage,
    cosmetics,
    cosmeticPagination,
    cosmeticsLoading,
    cosmeticSearch,
    cosmeticPage,
    upgrades,
    upgradePagination,
    upgradesLoading,
    upgradeSearch,
    upgradePage,
    pet,
    stats,
    coins,
    foodInventory,
    cosmeticInventory,
    userUpgrades,
    decay,
    loadState,
    click,
    walk,
    feed,
    rename,
    buyFoodItem,
    buyCosmeticItem,
    equipCosmeticItem,
    buyUpgradeItem,
    loadFoods,
    loadCosmetics,
    loadUpgrades,
    searchFoods,
    searchCosmetics,
    searchUpgrades,
    clearMessages,
    reset,
  };
});
