import { createPinia, setActivePinia } from 'pinia';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

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
import { useShopStore } from './shop.store';
import { useUiStore } from './ui.store';

vi.mock('../shop.api', () => ({
  getFoods: vi.fn(),
  buyFood: vi.fn(),
  getCosmetics: vi.fn(),
  buyCosmetic: vi.fn(),
  equipCosmetic: vi.fn(),
  getUpgrades: vi.fn(),
  buyUpgrade: vi.fn(),
}));

const mockedFoods = vi.mocked(getFoods);
const mockedBuyFood = vi.mocked(buyFood);
const mockedCosmetics = vi.mocked(getCosmetics);
const mockedBuyCosmetic = vi.mocked(buyCosmetic);
const mockedEquip = vi.mocked(equipCosmetic);
const mockedUpgrades = vi.mocked(getUpgrades);
const mockedBuyUpgrade = vi.mocked(buyUpgrade);

const pagination = {
  page: 1,
  limit: 12,
  total: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const food = {
  id: 'food-1',
  name: 'Морковка',
  description: '',
  price: 10,
  hungerRestore: 15,
  moodBonus: 2,
} as never;

const cosmetic = {
  id: 'cosmetic-1',
  name: 'Кепка',
  description: '',
  price: 100,
  slot: 'HAT',
  rarityLabel: 'Обычная',
} as never;

const upgrade = {
  id: 'upgrade-1',
  name: 'Крепкая лапа',
  description: '',
  effectType: 'CLICK_POWER',
  effectTypeLabel: 'Сила клика',
  effectValue: 1,
  ownedLevel: 1,
  maxLevel: 10,
  nextLevelPrice: 100,
  isMaxLevel: false,
} as never;

let store: ReturnType<typeof useShopStore>;
let refreshPet: MockInstance;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  store = useShopStore();
  refreshPet = vi.spyOn(usePetStore(), 'loadState').mockResolvedValue();

  mockedFoods.mockResolvedValue({ foods: [food], pagination } as never);
  mockedCosmetics.mockResolvedValue({
    cosmetics: [cosmetic],
    pagination,
  } as never);
  mockedUpgrades.mockResolvedValue({
    upgrades: [upgrade],
    pagination,
  } as never);
});

describe('catalog loading', () => {
  it('loads foods, cosmetics and upgrades', async () => {
    await store.loadAll();

    expect(store.foods).toEqual([food]);
    expect(store.cosmetics).toEqual([cosmetic]);
    expect(store.upgrades).toEqual([upgrade]);
    expect(store.loading).toBe(false);
  });

  it('sends search only when it has at least three characters', async () => {
    store.foodSearch = ' ab ';
    await store.loadFoods();

    expect(mockedFoods).toHaveBeenLastCalledWith({ page: 1, limit: 12 });

    store.foodSearch = 'морковка';
    await store.loadFoods();

    expect(mockedFoods).toHaveBeenLastCalledWith({
      page: 1,
      limit: 12,
      search: 'морковка',
    });
  });

  it('stores catalog errors as alerts', async () => {
    mockedFoods.mockRejectedValue(new Error('offline'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.loadFoods();

    expect(fail).toHaveBeenCalledWith('offline');
    expect(store.foodLoading).toBe(false);
  });

  it('resets the page before searching', async () => {
    store.foodPage = 3;
    store.cosmeticPage = 4;
    store.upgradePage = 5;

    await store.searchFoods();
    await store.searchCosmetics();
    await store.searchUpgrades();

    expect(store.foodPage).toBe(1);
    expect(store.cosmeticPage).toBe(1);
    expect(store.upgradePage).toBe(1);
  });
});

describe('purchases', () => {
  it('buys food and refreshes the pet', async () => {
    mockedBuyFood.mockResolvedValue({
      inventory: { food },
      spentCoins: '10',
    } as never);

    await store.buyFoodItem('food-1');

    expect(mockedBuyFood).toHaveBeenCalledWith('food-1', 1);
    expect(refreshPet).toHaveBeenCalled();
    expect(store.busyId).toBeNull();
  });

  it('buys cosmetics and equips them in one action', async () => {
    mockedBuyCosmetic.mockResolvedValue({
      inventory: { cosmetic },
      spentCoins: '100',
    } as never);
    mockedEquip.mockResolvedValue({
      id: 'inv-1',
      isEquipped: true,
      cosmetic,
    } as never);

    await store.buyAndEquipCosmetic('cosmetic-1');

    expect(mockedBuyCosmetic).toHaveBeenCalledWith('cosmetic-1');
    expect(mockedEquip).toHaveBeenCalledWith('cosmetic-1', true);
  });

  it('buys a cosmetic without equipping it', async () => {
    mockedBuyCosmetic.mockResolvedValue({
      inventory: { cosmetic },
      spentCoins: '100',
    } as never);

    await store.buyCosmeticItem('cosmetic-1');

    expect(mockedEquip).not.toHaveBeenCalled();
    expect(refreshPet).toHaveBeenCalled();
  });

  it('equips and unequips items', async () => {
    mockedEquip.mockResolvedValue({
      id: 'inv-1',
      isEquipped: false,
      cosmetic,
    } as never);

    await store.equipItem('cosmetic-1', false);

    expect(mockedEquip).toHaveBeenCalledWith('cosmetic-1', false);
    expect(useUiStore().alerts.at(-1)?.message).toContain('Снято');
  });

  it('buys an upgrade and reloads the catalog', async () => {
    mockedBuyUpgrade.mockResolvedValue({
      userUpgrade: { level: 2, upgrade },
    } as never);

    await store.buyUpgradeItem('upgrade-1');

    expect(mockedBuyUpgrade).toHaveBeenCalledWith('upgrade-1');
    expect(mockedUpgrades).toHaveBeenCalled();
    expect(refreshPet).toHaveBeenCalled();
  });

  it('reports purchase failures', async () => {
    mockedBuyFood.mockRejectedValue(new Error('no coins'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.buyFoodItem('food-1');

    expect(fail).toHaveBeenCalledWith('no coins');
    expect(store.busyId).toBeNull();
  });
});

describe('reset', () => {
  it('clears catalogs and filters', async () => {
    await store.loadAll();
    store.foodSearch = 'кот';
    store.foodPage = 2;

    store.reset();

    expect(store.foods).toEqual([]);
    expect(store.foodSearch).toBe('');
    expect(store.foodPage).toBe(1);
    expect(store.foodPagination).toBeNull();
  });
});
