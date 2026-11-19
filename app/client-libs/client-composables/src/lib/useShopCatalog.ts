import { useShopStore } from '@org/api-client';
import { storeToRefs } from 'pinia';

import type { StoreRefs } from './store-refs';

type ShopStore = ReturnType<typeof useShopStore>;

export function useShopCatalog(): StoreRefs<ShopStore> &
  Pick<
    ShopStore,
    | 'loadFoods'
    | 'loadCosmetics'
    | 'loadUpgrades'
    | 'loadAll'
    | 'buyFoodItem'
    | 'buyCosmeticItem'
    | 'buyAndEquipCosmetic'
    | 'equipItem'
    | 'buyUpgradeItem'
    | 'searchFoods'
    | 'searchCosmetics'
    | 'searchUpgrades'
    | 'reset'
  > {
  const store = useShopStore();
  const refs = storeToRefs(store);

  return {
    ...refs,
    loadFoods: store.loadFoods,
    loadCosmetics: store.loadCosmetics,
    loadUpgrades: store.loadUpgrades,
    loadAll: store.loadAll,
    buyFoodItem: store.buyFoodItem,
    buyCosmeticItem: store.buyCosmeticItem,
    buyAndEquipCosmetic: store.buyAndEquipCosmetic,
    equipItem: store.equipItem,
    buyUpgradeItem: store.buyUpgradeItem,
    searchFoods: store.searchFoods,
    searchCosmetics: store.searchCosmetics,
    searchUpgrades: store.searchUpgrades,
    reset: store.reset,
  };
}
