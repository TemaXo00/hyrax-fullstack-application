import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getApiErrorMessage } from '../http';
import {
  buyCosmetic,
  buyFood,
  buyUpgrade,
  equipCosmetic,
  getCosmetics,
  getFoods,
  getUpgrades,
} from '../shop.api';
import { usePetStore } from './pet.store';
import { useUiStore } from './ui.store';

import type { PaginationMeta } from '@org/types';
import type { Cosmetic, Food, UpgradeShop } from '../shop.types';

const PAGE_LIMIT = 12;

function buildQuery(page: number, search: string): {
  page: number;
  limit: number;
  search?: string;
} {
  const normalized = search.trim();

  return {
    page,
    limit: PAGE_LIMIT,
    ...(normalized.length >= 3 ? { search: normalized } : {}),
  };
}

export const useShopStore = defineStore('shop', () => {
  const foods = ref<Food[]>([]);
  const foodPage = ref(1);
  const foodSearch = ref('');
  const foodPagination = ref<PaginationMeta | null>(null);
  const foodLoading = ref(false);

  const cosmetics = ref<Cosmetic[]>([]);
  const cosmeticPage = ref(1);
  const cosmeticSearch = ref('');
  const cosmeticPagination = ref<PaginationMeta | null>(null);
  const cosmeticLoading = ref(false);

  const upgrades = ref<UpgradeShop[]>([]);
  const upgradePage = ref(1);
  const upgradeSearch = ref('');
  const upgradePagination = ref<PaginationMeta | null>(null);
  const upgradeLoading = ref(false);

  const busyId = ref<string | null>(null);
  const loading = computed(
    () => foodLoading.value || cosmeticLoading.value || upgradeLoading.value,
  );

  async function loadFoods(): Promise<void> {
    foodLoading.value = true;

    try {
      const result = await getFoods(buildQuery(foodPage.value, foodSearch.value));

      foods.value = result.foods;
      foodPagination.value = result.pagination;
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      foodLoading.value = false;
    }
  }

  async function loadCosmetics(): Promise<void> {
    cosmeticLoading.value = true;

    try {
      const result = await getCosmetics(
        buildQuery(cosmeticPage.value, cosmeticSearch.value),
      );

      cosmetics.value = result.cosmetics;
      cosmeticPagination.value = result.pagination;
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      cosmeticLoading.value = false;
    }
  }

  async function loadUpgrades(): Promise<void> {
    upgradeLoading.value = true;

    try {
      const result = await getUpgrades(
        buildQuery(upgradePage.value, upgradeSearch.value),
      );

      upgrades.value = result.upgrades;
      upgradePagination.value = result.pagination;
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      upgradeLoading.value = false;
    }
  }

  async function loadAll(): Promise<void> {
    await Promise.all([loadFoods(), loadCosmetics(), loadUpgrades()]);
  }

  async function buyFoodItem(foodId: string): Promise<void> {
    busyId.value = foodId;

    try {
      const result = await buyFood(foodId, 1);

      useUiStore().notify(
        `Куплено: ${result.inventory.food.name} · ${result.spentCoins} монет`,
      );
      await usePetStore().loadState({ silent: true });
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      busyId.value = null;
    }
  }

  async function buyCosmeticItem(cosmeticId: string): Promise<void> {
    busyId.value = cosmeticId;

    try {
      const result = await buyCosmetic(cosmeticId);

      useUiStore().notify(
        `Куплено: ${result.inventory.cosmetic.name} · ${result.spentCoins} монет`,
      );
      await usePetStore().loadState({ silent: true });
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      busyId.value = null;
    }
  }

  async function buyAndEquipCosmetic(cosmeticId: string): Promise<void> {
    busyId.value = cosmeticId;

    try {
      await buyCosmetic(cosmeticId);
      await equipCosmetic(cosmeticId, true);
      useUiStore().notify('Предмет куплен и надет.');
      await usePetStore().loadState({ silent: true });
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      busyId.value = null;
    }
  }

  async function equipItem(
    cosmeticId: string,
    equipped: boolean,
  ): Promise<void> {
    busyId.value = cosmeticId;

    try {
      const result = await equipCosmetic(cosmeticId, equipped);

      useUiStore().notify(
        result.isEquipped
          ? `Надето: ${result.cosmetic.name}`
          : `Снято: ${result.cosmetic.name}`,
      );
      await usePetStore().loadState({ silent: true });
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      busyId.value = null;
    }
  }

  async function buyUpgradeItem(upgradeId: string): Promise<void> {
    busyId.value = upgradeId;

    try {
      const result = await buyUpgrade(upgradeId);

      useUiStore().notify(
        `${result.userUpgrade.upgrade.name} · уровень ${result.userUpgrade.level}`,
      );
      await Promise.all([
        usePetStore().loadState({ silent: true }),
        loadUpgrades(),
      ]);
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      busyId.value = null;
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

  function reset(): void {
    foods.value = [];
    cosmetics.value = [];
    upgrades.value = [];
    foodPagination.value = null;
    cosmeticPagination.value = null;
    upgradePagination.value = null;
    foodPage.value = 1;
    cosmeticPage.value = 1;
    upgradePage.value = 1;
    foodSearch.value = '';
    cosmeticSearch.value = '';
    upgradeSearch.value = '';
    busyId.value = null;
  }

  return {
    foods,
    cosmetics,
    upgrades,
    foodPage,
    cosmeticPage,
    upgradePage,
    foodSearch,
    cosmeticSearch,
    upgradeSearch,
    foodPagination,
    cosmeticPagination,
    upgradePagination,
    foodLoading,
    cosmeticLoading,
    upgradeLoading,
    loading,
    busyId,
    loadFoods,
    loadCosmetics,
    loadUpgrades,
    loadAll,
    buyFoodItem,
    buyCosmeticItem,
    buyAndEquipCosmetic,
    equipItem,
    buyUpgradeItem,
    searchFoods,
    searchCosmetics,
    searchUpgrades,
    reset,
  };
});
