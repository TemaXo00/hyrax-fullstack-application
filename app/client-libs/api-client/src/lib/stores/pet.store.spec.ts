import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clickPet, feedPet, getPetState, renamePet, walkPet } from '../pet.api';
import { usePetStore } from './pet.store';
import { useUiStore } from './ui.store';

import type { PetActionResult, PetState } from '../pet.api';

vi.mock('../pet.api', () => ({
  getPetState: vi.fn(),
  renamePet: vi.fn(),
  clickPet: vi.fn(),
  walkPet: vi.fn(),
  feedPet: vi.fn(),
}));

const mockedState = vi.mocked(getPetState);
const mockedRename = vi.mocked(renamePet);
const mockedClick = vi.mocked(clickPet);
const mockedWalk = vi.mocked(walkPet);
const mockedFeed = vi.mocked(feedPet);

const pet = {
  id: 'pet-1',
  name: 'Авава',
  level: 4,
  xp: 60,
  xpToNextLevel: 250,
  hunger: 80,
  mood: 90,
  moodStatus: 'HAPPY' as const,
  moodStatusLabel: 'Счастлив',
  createdAt: '',
  updatedAt: '',
};

const stats = {
  id: 'stats-1',
  coins: '120',
  totalCoinsEarned: '500',
  totalClicks: '40',
  totalFeeds: '5',
  streak: 3,
  clickPower: 2,
  autoIncome: 1,
  lastSyncAt: '',
  createdAt: '',
  updatedAt: '',
};

const stateTemplate = {
  pet,
  stats,
  foodInventory: [],
  cosmeticInventory: [],
  upgrades: [],
  decay: null,
  autoIncomeCollected: '0',
  serverTime: '',
} as unknown as PetState;

let state: PetState;

const action = {
  action: 'CLICK',
  actionLabel: 'Клик',
  coinsEarned: '3',
  xpEarned: 1,
  coinsBalance: '123',
  totalClicks: '41',
  totalFeeds: '5',
  leveledUp: false,
  levelsGained: 0,
  autoIncomeCollected: '0',
  pet,
  stats,
} as unknown as PetActionResult;

let store: ReturnType<typeof usePetStore>;

beforeEach(() => {
  setActivePinia(createPinia());
  window.localStorage.clear();
  vi.clearAllMocks();
  state = structuredClone(stateTemplate);
  store = usePetStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('initial state', () => {
  it('uses the hyrax species by default and persists switches', () => {
    expect(store.species).toBe('hyrax');
    expect(store.speciesMeta.label).toBe('Даман');

    store.setSpecies('guinea-pig');

    expect(store.species).toBe('guinea-pig');
    expect(window.localStorage.getItem('hyrax.pet.species')).toBe('guinea-pig');
  });

  it('restores a valid stored species and ignores an invalid one', () => {
    window.localStorage.setItem('hyrax.pet.species', 'guinea-pig');
    setActivePinia(createPinia());
    expect(usePetStore().species).toBe('guinea-pig');

    window.localStorage.setItem('hyrax.pet.species', 'дракон');
    setActivePinia(createPinia());
    expect(usePetStore().species).toBe('hyrax');
  });

  it('exposes computed pet values and clamped percents', () => {
    store.state = state;

    expect(store.coins).toBe(120);
    expect(store.level).toBe(4);
    expect(store.xpPercent).toBeCloseTo((60 / 250) * 100);
    expect(store.moodPercent).toBe(90);
    expect(store.clickReward).toBe(1);
    expect(store.isBusy).toBe(false);
  });
});

describe('loadState', () => {
  it('loads the pet state', async () => {
    mockedState.mockResolvedValue(state);

    await store.loadState();

    expect(store.pet?.name).toBe('Авава');
    expect(store.loading).toBe(false);
  });

  it('stores an error and notifies on failure', async () => {
    mockedState.mockRejectedValue(new Error('offline'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.loadState();

    expect(store.error).toBe('offline');
    expect(fail).toHaveBeenCalledWith('offline');
  });

  it('does not toggle loading for silent loads', async () => {
    mockedState.mockResolvedValue(state);

    const promise = store.loadState({ silent: true });

    expect(store.loading).toBe(false);
    await promise;
  });
});

describe('click', () => {
  it('applies the result and accumulates pending clicks', async () => {
    store.state = state;
    mockedClick.mockResolvedValue(action);

    await store.click();

    expect(store.pendingClicks).toBe(1);
    expect(store.stats?.coins).toBe('120');
    expect(store.clickLimitLeft()).toBe(23);
  });

  it('shows a level-up notification', async () => {
    store.state = state;
    mockedClick.mockResolvedValue({
      ...action,
      leveledUp: true,
      pet: { ...pet, level: 5 },
    });
    const notify = vi.spyOn(useUiStore(), 'notify');

    await store.click();

    expect(notify).toHaveBeenCalledWith('Новый уровень: 5');
  });

  it('limits clicks to 24 per ten seconds', async () => {
    store.state = state;
    mockedClick.mockResolvedValue(action);
    const fail = vi.spyOn(useUiStore(), 'fail');

    for (let index = 0; index < 25; index += 1) {
      await store.click();
    }

    expect(mockedClick).toHaveBeenCalledTimes(24);
    expect(fail).toHaveBeenCalledWith(
      'Питомец устал от ласки. Подождите пару секунд.',
    );
  });

  it('reports API errors', async () => {
    mockedClick.mockRejectedValue(new Error('too fast'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.click();

    expect(store.error).toBe('too fast');
    expect(fail).toHaveBeenCalled();
  });
});

describe('walk', () => {
  it('requires pending clicks', async () => {
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.walk();

    expect(mockedWalk).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith(
      'Сначала погладьте питомца, чтобы накопить клики.',
    );
  });

  it('sends accumulated clicks, clears them and starts a cooldown', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    store.state = state;
    store.setPendingClicks(10);
    mockedWalk.mockResolvedValue({
      ...action,
      action: 'WALK',
      coinsEarned: '60',
    });

    await store.walk();

    expect(mockedWalk).toHaveBeenCalledWith(10);
    expect(store.pendingClicks).toBe(0);
    expect(store.remainingWalkCooldown()).toBe(30);
    expect(store.isWalkReady()).toBe(false);
    expect(useUiStore().alerts.at(-1)?.message).toContain('+60 монет');
  });

  it('blocks walking during the cooldown', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    store.setPendingClicks(5);
    store.setWalkReadyAt(Date.now() + 20_000);
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.walk();

    expect(mockedWalk).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith('Питомец ещё отдыхает: 20 с.');
  });

  it('reports walk failures', async () => {
    store.setPendingClicks(3);
    mockedWalk.mockRejectedValue(new Error('server'));

    await store.walk();

    expect(store.error).toBe('server');
    expect(store.busyAction).toBeNull();
  });
});

describe('feed and rename', () => {
  it('feeds the pet and refreshes the inventory', async () => {
    mockedFeed.mockResolvedValue({ ...action, action: 'FEED' });
    mockedState.mockResolvedValue(state);

    await store.feed('food-1');

    expect(mockedFeed).toHaveBeenCalledWith('food-1');
    expect(mockedState).toHaveBeenCalled();
    expect(useUiStore().alerts.at(-1)?.message).toBe('Питомец сыт и доволен.');
  });

  it('renames the pet', async () => {
    store.state = state;
    mockedRename.mockResolvedValue({ ...pet, name: 'Новое имя' });

    await expect(store.rename('Новое имя')).resolves.toBe(true);
    expect(store.pet?.name).toBe('Новое имя');
  });

  it('keeps the old name when rename fails', async () => {
    store.state = state;
    mockedRename.mockRejectedValue(new Error('bad name'));

    await expect(store.rename('')).resolves.toBe(false);
    expect(store.pet?.name).toBe('Авава');
    expect(store.error).toBe('bad name');
  });
});

describe('reset', () => {
  it('clears state and persisted counters', () => {
    store.state = state;
    store.setPendingClicks(12);
    store.setWalkReadyAt(Date.now() + 10_000);

    store.reset();

    expect(store.state).toBeNull();
    expect(store.pendingClicks).toBe(0);
    expect(store.remainingWalkCooldown()).toBe(0);
    expect(window.localStorage.getItem('hyrax.pet.pendingClicks')).toBe('0');
  });
});
