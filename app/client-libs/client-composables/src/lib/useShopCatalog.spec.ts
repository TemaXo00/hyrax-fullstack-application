import { useShopStore } from '@org/api-client';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRef } from 'vue';

import { useShopCatalog } from './useShopCatalog';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('useShopCatalog', () => {
  it('exposes catalog refs and delegates actions', async () => {
    const store = useShopStore();

    const loadFoods = vi.spyOn(store, 'loadFoods').mockResolvedValue();
    const loadCosmetics = vi.spyOn(store, 'loadCosmetics').mockResolvedValue();
    const loadUpgrades = vi.spyOn(store, 'loadUpgrades').mockResolvedValue();
    const loadAll = vi.spyOn(store, 'loadAll').mockResolvedValue();
    const buyFood = vi.spyOn(store, 'buyFoodItem').mockResolvedValue();
    const buyCosmetic = vi.spyOn(store, 'buyCosmeticItem').mockResolvedValue();
    const buyAndEquip = vi
      .spyOn(store, 'buyAndEquipCosmetic')
      .mockResolvedValue();
    const equip = vi.spyOn(store, 'equipItem').mockResolvedValue();
    const buyUpgrade = vi.spyOn(store, 'buyUpgradeItem').mockResolvedValue();
    const searchFoods = vi.spyOn(store, 'searchFoods').mockResolvedValue();
    const searchCosmetics = vi
      .spyOn(store, 'searchCosmetics')
      .mockResolvedValue();
    const searchUpgrades = vi
      .spyOn(store, 'searchUpgrades')
      .mockResolvedValue();
    const reset = vi.spyOn(store, 'reset');

    const catalog = useShopCatalog();

    expect(isRef(catalog.foods)).toBe(true);
    expect(isRef(catalog.busyId)).toBe(true);

    await catalog.loadFoods();
    await catalog.loadCosmetics();
    await catalog.loadUpgrades();
    await catalog.loadAll();
    await catalog.buyFoodItem('food-1');
    await catalog.buyCosmeticItem('cosmetic-1');
    await catalog.buyAndEquipCosmetic('cosmetic-1');
    await catalog.equipItem('cosmetic-1', true);
    await catalog.buyUpgradeItem('upgrade-1');
    await catalog.searchFoods();
    await catalog.searchCosmetics();
    await catalog.searchUpgrades();
    catalog.reset();

    expect(loadFoods).toHaveBeenCalledTimes(1);
    expect(loadCosmetics).toHaveBeenCalledTimes(1);
    expect(loadUpgrades).toHaveBeenCalledTimes(1);
    expect(loadAll).toHaveBeenCalledTimes(1);
    expect(buyFood).toHaveBeenCalledWith('food-1');
    expect(buyCosmetic).toHaveBeenCalledWith('cosmetic-1');
    expect(buyAndEquip).toHaveBeenCalledWith('cosmetic-1');
    expect(equip).toHaveBeenCalledWith('cosmetic-1', true);
    expect(buyUpgrade).toHaveBeenCalledWith('upgrade-1');
    expect(searchFoods).toHaveBeenCalledTimes(1);
    expect(searchCosmetics).toHaveBeenCalledTimes(1);
    expect(searchUpgrades).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
