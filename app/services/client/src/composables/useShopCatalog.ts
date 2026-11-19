import { storeToRefs } from 'pinia';
import { useShopStore } from '@org/api-client';

export function useShopCatalog() {
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
