import { createPinia, setActivePinia } from 'pinia';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

import { claimAchievement, getAchievements } from '../achievements.api';
import { useAchievementsStore } from './achievements.store';
import { usePetStore } from './pet.store';
import { useUiStore } from './ui.store';

vi.mock('../achievements.api', () => ({
  getAchievements: vi.fn(),
  claimAchievement: vi.fn(),
}));

const mockedLoad = vi.mocked(getAchievements);
const mockedClaim = vi.mocked(claimAchievement);

const pagination = {
  page: 1,
  limit: 30,
  total: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const achievement = {
  id: 'achievement-1',
  title: 'Первые шаги',
  description: '',
  conditionType: 'TOTAL_CLICKS',
  conditionTypeLabel: 'Клики',
  targetValue: 10,
  rewardCoins: 50,
  progress: 5,
  isCompleted: false,
  isClaimed: false,
  claimedAt: null,
} as never;

let store: ReturnType<typeof useAchievementsStore>;
let refreshPet: MockInstance;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  store = useAchievementsStore();
  refreshPet = vi.spyOn(usePetStore(), 'loadState').mockResolvedValue();

  mockedLoad.mockResolvedValue({
    achievements: [achievement],
    pagination,
  } as never);
});

describe('loading', () => {
  it('loads achievements with the current filters', async () => {
    await store.load();

    expect(mockedLoad).toHaveBeenCalledWith({ page: 1, limit: 30 });
    expect(store.items).toEqual([achievement]);
    expect(store.pagination).toEqual(pagination);
    expect(store.loading).toBe(false);
  });

  it('passes the condition filter and resets the page on change', async () => {
    store.page = 3;
    store.setCondition('LEVEL');

    await store.load();

    expect(store.page).toBe(1);
    expect(mockedLoad).toHaveBeenCalledWith({
      page: 1,
      limit: 30,
      conditionType: 'LEVEL',
    });
  });

  it('reports load failures', async () => {
    mockedLoad.mockRejectedValue(new Error('offline'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.load();

    expect(fail).toHaveBeenCalledWith('offline');
    expect(store.loading).toBe(false);
  });
});

describe('claiming', () => {
  it('claims a reward and reloads the pet', async () => {
    mockedClaim.mockResolvedValue({
      achievement,
      rewardCoins: '50',
    } as never);

    const promise = store.claim('achievement-1');

    expect(store.claimingId).toBe('achievement-1');

    await promise;

    expect(mockedClaim).toHaveBeenCalledWith('achievement-1');
    expect(useUiStore().alerts.at(-1)?.message).toContain('+50 монет');
    expect(mockedLoad).toHaveBeenCalled();
    expect(refreshPet).toHaveBeenCalledWith({ silent: true });
    expect(store.claimingId).toBeNull();
  });

  it('reports claim failures and clears the busy id', async () => {
    mockedClaim.mockRejectedValue(new Error('already claimed'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.claim('achievement-1');

    expect(fail).toHaveBeenCalledWith('already claimed');
    expect(store.claimingId).toBeNull();
  });
});

describe('reset', () => {
  it('clears list, filters and pagination', async () => {
    await store.load();
    store.setCondition('STREAK');
    store.page = 2;

    store.reset();

    expect(store.items).toEqual([]);
    expect(store.pagination).toBeNull();
    expect(store.page).toBe(1);
    expect(store.conditionType).toBeNull();
    expect(store.claimingId).toBeNull();
  });
});
