import { useAuthStore, LEADERBOARD_METRICS } from '@org/api-client';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import AchievementsPage from './AchievementsPage.vue';
import GamePage from './GamePage.vue';
import LeaderboardPage from './LeaderboardPage.vue';
import ProfilePage from './ProfilePage.vue';
import ShopPage from './ShopPage.vue';

const mocks = vi.hoisted(() => ({
  game: null as null | Record<string, unknown>,
  daily: null as null | Record<string, unknown>,
  achievements: null as null | Record<string, unknown>,
  shop: null as null | Record<string, unknown>,
  leaderboard: null as null | Record<string, unknown>,
  session: null as null | Record<string, unknown>,
  now: null as null | { value: number },
}));

vi.mock('@org/client-composables', async () => {
  const { ref: createRef } = await import('vue');

  mocks.game = {
    pet: createRef(null),
    loading: createRef(false),
    busyAction: createRef(null),
    pendingClicks: createRef(0),
    foodInventory: createRef([]),
    cosmeticInventory: createRef([]),
    species: createRef('hyrax'),
    speciesMeta: createRef({
      label: 'Даман',
      image: '/hyrax.png',
      note: 'Спокойный и тёплый.',
    }),
    clickReward: createRef(2),
    autoIncome: createRef(0),
    level: createRef(4),
    xp: createRef(60),
    xpToNextLevel: createRef(250),
    xpPercent: createRef(24),
    mood: createRef(90),
    hunger: createRef(80),
    coins: createRef(100),
    loadState: vi.fn(),
    click: vi.fn(),
    walk: vi.fn(),
    feed: vi.fn(),
    rename: vi.fn(),
    setSpecies: vi.fn(),
    remainingWalkCooldown: vi.fn(() => 0),
    isWalkReady: vi.fn(() => true),
    clickLimitLeft: vi.fn(() => 24),
    reset: vi.fn(),
  };

  mocks.daily = {
    state: createRef(null),
    claiming: createRef(false),
    load: vi.fn(),
    claim: vi.fn(),
    reset: vi.fn(),
  };

  mocks.achievements = {
    items: createRef([]),
    loading: createRef(false),
    claimingId: createRef(null),
    load: vi.fn(),
    claim: vi.fn(),
    setCondition: vi.fn(),
    reset: vi.fn(),
  };

  mocks.shop = {
    loadAll: vi.fn(),
  };

  mocks.leaderboard = {
    board: createRef(null),
    myPosition: createRef(null),
    metric: createRef('TOTAL_COINS_EARNED'),
    loading: createRef(false),
    load: vi.fn(),
    loadMyPosition: vi.fn(),
    setMetric: vi.fn(),
    goToPage: vi.fn(),
    reset: vi.fn(),
  };

  mocks.now = createRef(Date.now());

  mocks.session = {
    logout: vi.fn(),
    resetGame: vi.fn(),
  };

  return {
    usePetGame: () => mocks.game,
    useDailyReward: () => mocks.daily,
    useAchievements: () => mocks.achievements,
    useShopCatalog: () => mocks.shop,
    useLeaderboard: () => mocks.leaderboard,
    useSession: () => mocks.session,
    useNow: () => mocks.now,
  };
});

function game() {
  return mocks.game as {
    pet: { value: { name: string } | null };
    loading: { value: boolean };
    pendingClicks: { value: number };
    coins: { value: number };
    foodInventory: { value: unknown[] };
    loadState: ReturnType<typeof vi.fn>;
    click: ReturnType<typeof vi.fn>;
    walk: ReturnType<typeof vi.fn>;
    feed: ReturnType<typeof vi.fn>;
    rename: ReturnType<typeof vi.fn>;
    setSpecies: ReturnType<typeof vi.fn>;
    remainingWalkCooldown: ReturnType<typeof vi.fn>;
  };
}

function daily() {
  return mocks.daily as {
    state: { value: unknown };
    claiming: { value: boolean };
    load: ReturnType<typeof vi.fn>;
    claim: ReturnType<typeof vi.fn>;
  };
}

function achievements() {
  return mocks.achievements as {
    items: { value: unknown[] };
    loading: { value: boolean };
    claimingId: { value: string | null };
    load: ReturnType<typeof vi.fn>;
    claim: ReturnType<typeof vi.fn>;
    setCondition: ReturnType<typeof vi.fn>;
  };
}

function shop() {
  return mocks.shop as { loadAll: ReturnType<typeof vi.fn> };
}

function leaderboard() {
  return mocks.leaderboard as {
    board: { value: unknown };
    metric: { value: string };
    loading: { value: boolean };
    load: ReturnType<typeof vi.fn>;
    loadMyPosition: ReturnType<typeof vi.fn>;
    setMetric: ReturnType<typeof vi.fn>;
    goToPage: ReturnType<typeof vi.fn>;
  };
}

function session() {
  return mocks.session as { logout: ReturnType<typeof vi.fn> };
}

const PetStageStub = defineComponent({
  name: 'PetStage',
  emits: ['editName'],
  setup(_, { emit }) {
    return () =>
      h(
        'button',
        { class: 'pet-stage', onClick: () => emit('editName') },
        'stage',
      );
  },
});

const PetActionsStub = defineComponent({
  name: 'PetActions',
  props: {
    pendingClicks: Number,
    cooldownSeconds: Number,
    busy: Boolean,
    clickReward: Number,
  },
  emits: ['walk', 'feed', 'pet'],
  setup(_, { emit }) {
    return () =>
      h('div', { class: 'pet-actions' }, [
        h('button', { class: 'walk', onClick: () => emit('walk') }, 'walk'),
        h('button', { class: 'feed', onClick: () => emit('feed') }, 'feed'),
        h('button', { class: 'pet', onClick: () => emit('pet') }, 'pet'),
      ]);
  },
});

const PetStatusStub = defineComponent({
  name: 'PetStatus',
  props: {
    level: Number,
    xp: Number,
    xpToNextLevel: Number,
    xpPercent: Number,
    mood: Number,
    hunger: Number,
    clickReward: Number,
    autoIncome: Number,
  },
  setup(props) {
    return () => h('div', { class: 'pet-status' }, String(props.level));
  },
});

const SpeciesSwitchStub = defineComponent({
  name: 'SpeciesSwitch',
  props: { species: String },
  emits: ['change'],
  setup(_, { emit }) {
    return () =>
      h(
        'button',
        {
          class: 'species-switch',
          onClick: () => emit('change', 'guinea-pig'),
        },
        'switch',
      );
  },
});

const DailyRewardCardStub = defineComponent({
  name: 'DailyRewardCard',
  props: { state: Object, claiming: Boolean },
  emits: ['claim'],
  setup(_, { emit }) {
    return () =>
      h(
        'button',
        { class: 'daily-claim', onClick: () => emit('claim') },
        'claim',
      );
  },
});

const FeedDialogStub = defineComponent({
  name: 'FeedDialog',
  props: { open: Boolean, inventory: Array, busy: Boolean },
  emits: ['feed', 'close'],
  setup(_, { emit }) {
    return () =>
      h('div', { class: 'feed-dialog' }, [
        h(
          'button',
          { class: 'feed-send', onClick: () => emit('feed', 'food-1') },
          'send',
        ),
        h(
          'button',
          { class: 'feed-close', onClick: () => emit('close') },
          'close',
        ),
      ]);
  },
});

const RenameDialogStub = defineComponent({
  name: 'RenameDialog',
  props: { initialName: String, busy: Boolean },
  emits: ['save', 'close'],
  setup(_, { emit }) {
    return () =>
      h('div', { class: 'rename-dialog' }, [
        h(
          'button',
          { class: 'rename-save', onClick: () => emit('save', 'Новое имя') },
          'save',
        ),
        h(
          'button',
          { class: 'rename-close', onClick: () => emit('close') },
          'close',
        ),
      ]);
  },
});

const AchievementItemStub = defineComponent({
  name: 'AchievementItem',
  props: { achievement: Object, loading: Boolean },
  emits: ['claim'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          class: 'achievement-claim',
          onClick: () =>
            emit(
              'claim',
              (props.achievement as { id: string } | undefined)?.id,
            ),
        },
        'claim',
      );
  },
});

const LeaderboardListStub = defineComponent({
  name: 'LeaderboardList',
  props: {
    board: Object,
    myPosition: Object,
    currentNickname: String,
    loading: Boolean,
  },
  emits: ['change'],
  setup(_, { emit }) {
    return () =>
      h(
        'button',
        { class: 'next-page', onClick: () => emit('change', 2) },
        'next',
      );
  },
});

const FoodCatalogStub = defineComponent({
  name: 'FoodCatalog',
  setup: () => () => h('div', { class: 'food-catalog' }, 'food'),
});

const UpgradeCatalogStub = defineComponent({
  name: 'UpgradeCatalog',
  setup: () => () => h('div', { class: 'upgrade-catalog' }, 'upgrades'),
});

const CosmeticCatalogStub = defineComponent({
  name: 'CosmeticCatalog',
  setup: () => () => h('div', { class: 'cosmetic-catalog' }, 'cosmetics'),
});

const gameStubs = {
  PetStage: PetStageStub,
  PetActions: PetActionsStub,
  PetStatus: PetStatusStub,
  SpeciesSwitch: SpeciesSwitchStub,
  DailyRewardCard: DailyRewardCardStub,
  FeedDialog: FeedDialogStub,
  RenameDialog: RenameDialogStub,
};

const achievementStubs = {
  AchievementItem: AchievementItemStub,
};

const shopStubs = {
  FoodCatalog: FoodCatalogStub,
  UpgradeCatalog: UpgradeCatalogStub,
  CosmeticCatalog: CosmeticCatalogStub,
};

const leaderboardStubs = {
  LeaderboardList: LeaderboardListStub,
};

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();

  game().pet.value = { name: 'Авава' };
  game().loading.value = false;
  game().pendingClicks.value = 3;
  game().coins.value = 100;
  game().foodInventory.value = [];
  game().rename.mockResolvedValue(true);
  game().remainingWalkCooldown.mockReturnValue(0);

  daily().state.value = null;
  daily().claiming.value = false;

  achievements().items.value = [];
  achievements().loading.value = false;
  achievements().claimingId.value = null;

  leaderboard().board.value = null;
  leaderboard().metric.value = 'TOTAL_COINS_EARNED';
  leaderboard().loading.value = false;

  (mocks.now as { value: number }).value = Date.now();
});

describe('GamePage', () => {
  it('shows a skeleton and loads data when the pet is missing', () => {
    game().pet.value = null;
    game().loading.value = true;

    const wrapper = mount(GamePage, { global: { stubs: gameStubs } });

    expect(wrapper.findAll('.animate-pulse')).toHaveLength(3);
    expect(game().loadState).toHaveBeenCalledTimes(1);
    expect(daily().load).toHaveBeenCalledTimes(1);
  });

  it('renders the stable state and passes props to children', () => {
    const wrapper = mount(GamePage, { global: { stubs: gameStubs } });

    const status = wrapper.findComponent(PetStatusStub);
    const actions = wrapper.findComponent(PetActionsStub);

    expect(wrapper.find('.pet-stage').exists()).toBe(true);
    expect(status.props('level')).toBe(4);
    expect(status.props('xp')).toBe(60);
    expect(actions.props('pendingClicks')).toBe(3);
    expect(actions.props('clickReward')).toBe(2);
    expect(wrapper.text()).toContain('Даман');
    expect(wrapper.text()).toContain('накопленных кликов');
    expect(game().loadState).not.toHaveBeenCalled();
  });

  it('passes the cooldown to the actions', () => {
    game().remainingWalkCooldown.mockReturnValue(12);

    const wrapper = mount(GamePage, { global: { stubs: gameStubs } });

    expect(wrapper.findComponent(PetActionsStub).props('cooldownSeconds')).toBe(
      12,
    );
  });

  it('opens the rename dialog and saves a new name', async () => {
    const wrapper = mount(GamePage, { global: { stubs: gameStubs } });

    await wrapper.get('.pet-stage').trigger('click');

    expect(wrapper.find('.rename-dialog').exists()).toBe(true);

    await wrapper.get('.rename-save').trigger('click');
    await wrapper.vm.$nextTick();

    expect(game().rename).toHaveBeenCalledWith('Новое имя');
    expect(wrapper.find('.rename-dialog').exists()).toBe(false);
  });

  it('walks, feeds and pets the animal', async () => {
    const wrapper = mount(GamePage, { global: { stubs: gameStubs } });

    await wrapper.get('.walk').trigger('click');
    await wrapper.get('.pet').trigger('click');
    await wrapper.get('.feed').trigger('click');

    expect(game().walk).toHaveBeenCalledTimes(1);
    expect(game().click).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.feed-dialog').exists()).toBe(true);

    await wrapper.get('.feed-send').trigger('click');
    await wrapper.vm.$nextTick();

    expect(game().feed).toHaveBeenCalledWith('food-1');
    expect(wrapper.find('.feed-dialog').exists()).toBe(false);
  });

  it('claims the daily reward', async () => {
    const wrapper = mount(GamePage, { global: { stubs: gameStubs } });

    await wrapper.get('.daily-claim').trigger('click');

    expect(daily().claim).toHaveBeenCalledTimes(1);
  });
});

describe('ShopPage', () => {
  it('renders the food tab and switches tabs', async () => {
    const wrapper = mount(ShopPage, { global: { stubs: shopStubs } });

    expect(shop().loadAll).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.food-catalog').exists()).toBe(true);

    const upgrades = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Улучшения');

    await upgrades?.trigger('click');

    expect(wrapper.find('.upgrade-catalog').exists()).toBe(true);
    expect(wrapper.find('.food-catalog').exists()).toBe(false);

    const cosmetics = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Косметика');

    await cosmetics?.trigger('click');

    expect(wrapper.find('.cosmetic-catalog').exists()).toBe(true);
  });

  it('reloads the pet balance only when it is empty', async () => {
    game().coins.value = 50;

    mount(ShopPage, { global: { stubs: shopStubs } });
    expect(game().loadState).not.toHaveBeenCalled();

    game().coins.value = 0;

    mount(ShopPage, { global: { stubs: shopStubs } });
    expect(game().loadState).toHaveBeenCalledWith({ silent: true });
  });
});

describe('AchievementsPage', () => {
  const items = [
    {
      id: 'a-1',
      title: 'Первые шаги',
      description: '',
      conditionType: 'TOTAL_CLICKS',
      conditionTypeLabel: 'Клики',
      conditionValue: 10,
      progress: 10,
      rewardCoins: 50,
      isUnlocked: true,
      isClaimed: false,
    },
    {
      id: 'a-2',
      title: 'Забота',
      description: '',
      conditionType: 'TOTAL_FEEDS',
      conditionTypeLabel: 'Кормления',
      conditionValue: 5,
      progress: 5,
      rewardCoins: 30,
      isUnlocked: true,
      isClaimed: true,
    },
  ];

  it('loads achievements and shows counters', () => {
    achievements().items.value = items;

    const wrapper = mount(AchievementsPage, {
      global: { stubs: achievementStubs },
    });

    expect(achievements().load).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('1 получено');
    expect(wrapper.text()).toContain('Доступно к получению: 1');
    expect(wrapper.findAll('.achievement-claim')).toHaveLength(2);
  });

  it('shows the loading skeleton and the empty state', () => {
    achievements().loading.value = true;

    const loading = mount(AchievementsPage, {
      global: { stubs: achievementStubs },
    });

    expect(loading.findAll('.animate-pulse')).toHaveLength(4);

    achievements().loading.value = false;

    const empty = mount(AchievementsPage, {
      global: { stubs: achievementStubs },
    });

    expect(empty.text()).toContain('Пока нет достижений');
  });

  it('applies a condition filter and reloads', async () => {
    achievements().items.value = items;

    const wrapper = mount(AchievementsPage, {
      global: { stubs: achievementStubs },
    });

    const filter = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Всего кликов');

    await filter?.trigger('click');

    expect(achievements().setCondition).toHaveBeenCalledWith('TOTAL_CLICKS');
    expect(achievements().load).toHaveBeenCalledTimes(2);

    const all = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Все');

    await all?.trigger('click');

    expect(achievements().setCondition).toHaveBeenLastCalledWith(null);
  });

  it('claims an achievement', async () => {
    achievements().items.value = items;

    const wrapper = mount(AchievementsPage, {
      global: { stubs: achievementStubs },
    });

    await wrapper.get('.achievement-claim').trigger('click');

    expect(achievements().claim).toHaveBeenCalledWith('a-1');
  });
});

describe('LeaderboardPage', () => {
  it('loads the board, shows the metric and reacts to controls', async () => {
    useAuthStore().user = { nickname: 'Alina' } as never;
    leaderboard().board.value = {
      metricLabel: 'Монеты',
      entries: [],
      pagination: { page: 1, totalPages: 1 },
    };

    const wrapper = mount(LeaderboardPage, {
      global: { plugins: [pinia], stubs: leaderboardStubs },
    });

    expect(leaderboard().load).toHaveBeenCalledTimes(1);
    expect(leaderboard().loadMyPosition).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Монеты');
    expect(
      wrapper.findComponent(LeaderboardListStub).props('currentNickname'),
    ).toBe('Alina');

    const metric = wrapper
      .findAll('button')
      .find((button) => button.text() === LEADERBOARD_METRICS[1]?.short);

    await metric?.trigger('click');

    expect(leaderboard().setMetric).toHaveBeenCalledWith(
      LEADERBOARD_METRICS[1]?.value,
    );

    await wrapper.get('.next-page').trigger('click');

    expect(leaderboard().goToPage).toHaveBeenCalledWith(2);
  });

  it('falls back to the default metric label', () => {
    const wrapper = mount(LeaderboardPage, {
      global: { plugins: [pinia], stubs: leaderboardStubs },
    });

    expect(wrapper.text()).toContain('Монеты');
  });
});

describe('ProfilePage', () => {
  it('renders the account and pet stats', () => {
    useAuthStore().user = {
      nickname: 'Alina',
      roleLabel: 'Игрок',
      stats: { totalClicks: 40, totalFeeds: 5 },
      streak: { currentStreak: 3, bestStreak: 7 },
      achievements: [{ id: 'a-1' }, { id: 'a-2' }],
    } as never;
    game().pet.value = { name: 'Авава' };
    game().foodInventory.value = [{ id: 'f-1' }, { id: 'f-2' }];

    const wrapper = mount(ProfilePage, {
      global: { plugins: [pinia], stubs: { SpeciesSwitch: SpeciesSwitchStub } },
    });

    expect(wrapper.text()).toContain('Alina');
    expect(wrapper.text()).toContain('Авава');
    expect(wrapper.text()).toContain('Уровень 4');
    expect(wrapper.text()).toContain('40');
    expect(wrapper.text()).toContain('5');
    expect(wrapper.text()).toContain('3 дн.');
    expect(wrapper.text()).toContain('7 дн.');
    expect(wrapper.text()).toContain('2');
  });

  it('uses fallbacks without a user and switches species', async () => {
    const wrapper = mount(ProfilePage, {
      global: { plugins: [pinia], stubs: { SpeciesSwitch: SpeciesSwitchStub } },
    });

    expect(wrapper.text()).toContain('Игрок');
    expect(wrapper.text()).toContain('Питомец');
    expect(wrapper.text()).toContain('0 дн.');

    await wrapper.get('.species-switch').trigger('click');

    expect(game().setSpecies).toHaveBeenCalledWith('guinea-pig');
  });

  it('logs out', async () => {
    const wrapper = mount(ProfilePage, {
      global: { plugins: [pinia], stubs: { SpeciesSwitch: SpeciesSwitchStub } },
    });

    const logout = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Выйти из аккаунта'));

    await logout?.trigger('click');

    expect(session().logout).toHaveBeenCalledTimes(1);
  });
});
