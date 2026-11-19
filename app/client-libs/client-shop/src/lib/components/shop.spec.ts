import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CosmeticCatalog from './CosmeticCatalog.vue';
import FoodCatalog from './FoodCatalog.vue';
import ShopItem from './ShopItem.vue';
import UpgradeCatalog from './UpgradeCatalog.vue';

const mocks = vi.hoisted(() => ({
  shop: null as null | Record<string, unknown>,
  pet: null as null | Record<string, unknown>,
}));

vi.mock('@org/client-composables', async () => {
  const { ref: createRef } = await import('vue');

  mocks.shop = {
    foods: createRef([]),
    foodLoading: createRef(false),
    foodPagination: createRef(null),
    foodPage: createRef(1),
    buyFoodItem: vi.fn(),
    loadFoods: vi.fn(),
    cosmetics: createRef([]),
    cosmeticLoading: createRef(false),
    cosmeticPagination: createRef(null),
    cosmeticPage: createRef(1),
    buyAndEquipCosmetic: vi.fn(),
    equipItem: vi.fn(),
    loadCosmetics: vi.fn(),
    upgrades: createRef([]),
    upgradeLoading: createRef(false),
    upgradePagination: createRef(null),
    upgradePage: createRef(1),
    buyUpgradeItem: vi.fn(),
    loadUpgrades: vi.fn(),
    busyId: createRef(null),
  };

  mocks.pet = {
    coins: createRef(100),
    foodInventory: createRef([]),
    cosmeticInventory: createRef([]),
  };

  return {
    useShopCatalog: () => mocks.shop,
    usePetGame: () => mocks.pet,
  };
});

function shop() {
  return mocks.shop as {
    foods: { value: unknown[] };
    foodLoading: { value: boolean };
    foodPagination: { value: unknown };
    foodPage: { value: number };
    buyFoodItem: ReturnType<typeof vi.fn>;
    loadFoods: ReturnType<typeof vi.fn>;
    cosmetics: { value: unknown[] };
    cosmeticLoading: { value: boolean };
    cosmeticPagination: { value: unknown };
    cosmeticPage: { value: number };
    buyAndEquipCosmetic: ReturnType<typeof vi.fn>;
    equipItem: ReturnType<typeof vi.fn>;
    loadCosmetics: ReturnType<typeof vi.fn>;
    upgrades: { value: unknown[] };
    upgradeLoading: { value: boolean };
    upgradePagination: { value: unknown };
    upgradePage: { value: number };
    buyUpgradeItem: ReturnType<typeof vi.fn>;
    loadUpgrades: ReturnType<typeof vi.fn>;
    busyId: { value: string | null };
  };
}

function pet() {
  return mocks.pet as {
    coins: { value: number };
    foodInventory: { value: unknown[] };
    cosmeticInventory: { value: unknown[] };
  };
}

const food = {
  id: 'food-1',
  name: 'Морковка',
  description: 'Хрустящая',
  price: 10,
  hungerRestore: 15,
  moodBonus: 2,
};

const cosmetic = {
  id: 'cosmetic-1',
  name: 'Кепка',
  description: 'Тёплая',
  price: 50,
  slot: 'HAT',
  rarityLabel: 'Обычная',
};

const upgrade = {
  id: 'upgrade-1',
  name: 'Сильная лапа',
  description: 'Больше монет',
  effectType: 'CLICK_POWER',
  effectTypeLabel: 'Сила клика',
  effectValue: 2,
  ownedLevel: 1,
  maxLevel: 5,
  nextLevelPrice: 100,
  isMaxLevel: false,
};

beforeEach(() => {
  const state = shop();

  state.foods.value = [];
  state.foodLoading.value = false;
  state.foodPagination.value = null;
  state.foodPage.value = 1;
  state.cosmetics.value = [];
  state.cosmeticLoading.value = false;
  state.cosmeticPagination.value = null;
  state.cosmeticPage.value = 1;
  state.upgrades.value = [];
  state.upgradeLoading.value = false;
  state.upgradePagination.value = null;
  state.upgradePage.value = 1;
  state.busyId.value = null;

  pet().coins.value = 100;
  pet().foodInventory.value = [];
  pet().cosmeticInventory.value = [];

  vi.clearAllMocks();
});

describe('ShopItem', () => {
  it('renders price, badge, description and emits the action', async () => {
    const wrapper = mount(ShopItem, {
      props: {
        title: 'Морковка',
        description: 'Хрустящая',
        glyph: '🥕',
        price: 10,
        badge: '×2',
        actionLabel: 'Купить',
      },
    });

    expect(wrapper.text()).toContain('Морковка');
    expect(wrapper.text()).toContain('Хрустящая');
    expect(wrapper.text()).toContain('🥕');
    expect(wrapper.text()).toContain('×2');
    expect(wrapper.text()).toContain('10');

    const button = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Купить');

    await button?.trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('shows collection text when there is no price', () => {
    const wrapper = mount(ShopItem, {
      props: {
        title: 'Кепка',
        glyph: '🧢',
        price: null,
        actionLabel: 'Надеть',
        tone: 'moss',
      },
    });

    expect(wrapper.text()).toContain('в коллекции');
  });

  it('renders a preview and the slot content', () => {
    const wrapper = mount(ShopItem, {
      props: {
        title: 'Закат',
        glyph: '🌅',
        actionLabel: 'Купить',
        preview: 'linear-gradient(red, blue)',
      },
      slots: { default: '<span>Бонус</span>' },
    });

    expect(wrapper.text()).toContain('Бонус');
    expect(wrapper.find('.h-20').attributes('style')).toContain(
      'linear-gradient',
    );
  });

  it('disables the action and shows a spinner', () => {
    const wrapper = mount(ShopItem, {
      props: {
        title: 'Кепка',
        glyph: '🧢',
        actionLabel: 'Не хватает',
        disabled: true,
        loading: true,
      },
    });

    const button = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Не хватает');

    expect(button?.attributes('disabled')).toBeDefined();
    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });
});

describe('FoodCatalog', () => {
  it('shows skeletons while loading an empty catalog', () => {
    shop().foodLoading.value = true;

    const wrapper = mount(FoodCatalog);

    expect(wrapper.findAll('.animate-pulse')).toHaveLength(4);
  });

  it('shows an empty state', () => {
    const wrapper = mount(FoodCatalog);

    expect(wrapper.text()).toContain('Полки пока пусты');
  });

  it('renders food with inventory badges and buys it', async () => {
    shop().foods.value = [food];
    pet().foodInventory.value = [{ food, quantity: 3 }];

    const wrapper = mount(FoodCatalog);

    expect(wrapper.text()).toContain('Морковка');
    expect(wrapper.text()).toContain('×3');
    expect(wrapper.text()).toContain('+15 сытости');
    expect(wrapper.text()).toContain('+2 настроения');

    const button = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Купить');

    await button?.trigger('click');

    expect(shop().buyFoodItem).toHaveBeenCalledWith('food-1');
  });

  it('disables buying when there are not enough coins', () => {
    pet().coins.value = 5;
    shop().foods.value = [food];

    const wrapper = mount(FoodCatalog);
    const button = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Не хватает');

    expect(button?.attributes('disabled')).toBeDefined();
  });

  it('switches pages and reloads the catalog', async () => {
    shop().foods.value = [food];
    shop().foodPagination.value = { totalPages: 3 };

    const wrapper = mount(FoodCatalog);

    await wrapper
      .get('button[aria-label="Следующая страница"]')
      .trigger('click');

    expect(shop().foodPage.value).toBe(2);
    expect(shop().loadFoods).toHaveBeenCalledTimes(1);
  });
});

describe('CosmeticCatalog', () => {
  const hat = { ...cosmetic, slot: 'HAT', description: 'Шляпная' };
  const background = {
    ...cosmetic,
    id: 'cosmetic-2',
    name: 'Закат',
    price: 80,
    slot: 'BACKGROUND',
  };

  it('shows the loading skeleton and an empty state', () => {
    shop().cosmeticLoading.value = true;

    const loading = mount(CosmeticCatalog);

    expect(loading.findAll('.animate-pulse')).toHaveLength(4);

    shop().cosmeticLoading.value = false;

    const empty = mount(CosmeticCatalog);

    expect(empty.text()).toContain('Ничего не найдено');
  });

  it('filters items by category and buys an affordable item', async () => {
    shop().cosmetics.value = [background, hat];

    const wrapper = mount(CosmeticCatalog);

    expect(wrapper.text()).toContain('Закат');
    expect(wrapper.text()).not.toContain('Шляпная');

    const hats = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Шляпы');

    await hats?.trigger('click');

    expect(wrapper.text()).toContain('Шляпная');
    expect(wrapper.text()).not.toContain('Закат');

    const buy = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Купить');

    await buy?.trigger('click');

    expect(shop().buyAndEquipCosmetic).toHaveBeenCalledWith('cosmetic-1');
  });

  it('switches the All filter on', async () => {
    shop().cosmetics.value = [background, hat];

    const wrapper = mount(CosmeticCatalog);
    const all = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Все');

    await all?.trigger('click');

    expect(wrapper.text()).toContain('Закат');
    expect(wrapper.text()).toContain('Шляпная');
  });

  it('equips owned items and unequips equipped ones', async () => {
    shop().cosmetics.value = [hat];
    pet().cosmeticInventory.value = [
      { id: 'inv-1', isEquipped: false, cosmetic: hat },
    ];

    const wrapper = mount(CosmeticCatalog);
    const hats = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Шляпы');

    await hats?.trigger('click');

    const wear = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Надеть');

    await wear?.trigger('click');

    expect(shop().equipItem).toHaveBeenCalledWith('cosmetic-1', true);

    pet().cosmeticInventory.value = [
      { id: 'inv-1', isEquipped: true, cosmetic: hat },
    ];

    const equipped = mount(CosmeticCatalog);
    const equippedHats = equipped
      .findAll('button')
      .find((entry) => entry.text() === 'Шляпы');

    await equippedHats?.trigger('click');

    const remove = equipped
      .findAll('button')
      .find((entry) => entry.text() === 'Снять');

    await remove?.trigger('click');

    expect(shop().equipItem).toHaveBeenCalledWith('cosmetic-1', false);
  });

  it('disables unaffordable items', () => {
    pet().coins.value = 1;
    shop().cosmetics.value = [background, hat];

    const wrapper = mount(CosmeticCatalog);
    const button = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Не хватает');

    expect(button?.attributes('disabled')).toBeDefined();
  });

  it('switches pages', async () => {
    shop().cosmetics.value = [background];
    shop().cosmeticPagination.value = { totalPages: 2 };

    const wrapper = mount(CosmeticCatalog);

    await wrapper
      .get('button[aria-label="Следующая страница"]')
      .trigger('click');

    expect(shop().cosmeticPage.value).toBe(2);
    expect(shop().loadCosmetics).toHaveBeenCalledTimes(1);
  });
});

describe('UpgradeCatalog', () => {
  it('shows the loading skeleton and an empty state', () => {
    shop().upgradeLoading.value = true;

    const loading = mount(UpgradeCatalog);

    expect(loading.findAll('.animate-pulse')).toHaveLength(4);

    shop().upgradeLoading.value = false;

    const empty = mount(UpgradeCatalog);

    expect(empty.text()).toContain('Улучшений нет');
  });

  it('renders an upgrade and buys it', async () => {
    shop().upgrades.value = [upgrade];

    const wrapper = mount(UpgradeCatalog);

    expect(wrapper.text()).toContain('Сильная лапа');
    expect(wrapper.text()).toContain('1/5');
    expect(wrapper.text()).toContain('Сила клика +2 за уровень');

    const button = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Улучшить');

    await button?.trigger('click');

    expect(shop().buyUpgradeItem).toHaveBeenCalledWith('upgrade-1');
  });

  it('shows the max level state', () => {
    shop().upgrades.value = [
      { ...upgrade, isMaxLevel: true, ownedLevel: 5, maxLevel: 5 },
    ];

    const wrapper = mount(UpgradeCatalog);
    const button = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Максимум');

    expect(button?.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('в коллекции');
  });

  it('disables unaffordable upgrades', () => {
    pet().coins.value = 10;
    shop().upgrades.value = [upgrade];

    const wrapper = mount(UpgradeCatalog);
    const button = wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Не хватает');

    expect(button?.attributes('disabled')).toBeDefined();
  });

  it('switches pages', async () => {
    shop().upgrades.value = [upgrade];
    shop().upgradePagination.value = { totalPages: 2 };

    const wrapper = mount(UpgradeCatalog);

    await wrapper
      .get('button[aria-label="Следующая страница"]')
      .trigger('click');

    expect(shop().upgradePage.value).toBe(2);
    expect(shop().loadUpgrades).toHaveBeenCalledTimes(1);
  });
});
