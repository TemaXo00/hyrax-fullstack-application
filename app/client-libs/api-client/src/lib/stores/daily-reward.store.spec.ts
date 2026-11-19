import { createPinia, setActivePinia } from 'pinia';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

import { claimDailyReward, getDailyRewardState } from '../daily-reward.api';
import { useDailyRewardStore } from './daily-reward.store';
import { usePetStore } from './pet.store';
import { useUiStore } from './ui.store';

vi.mock('../daily-reward.api', () => ({
  getDailyRewardState: vi.fn(),
  claimDailyReward: vi.fn(),
}));

const mockedLoad = vi.mocked(getDailyRewardState);
const mockedClaim = vi.mocked(claimDailyReward);

const rewardState = {
  canClaim: true,
  currentDay: 3,
  nextRewardCoins: 70,
  streak: 2,
  days: [
    { day: 1, coins: 10, hasItem: false, isClaimed: true, isToday: false },
    { day: 2, coins: 25, hasItem: true, isClaimed: true, isToday: false },
    { day: 3, coins: 70, hasItem: false, isClaimed: false, isToday: true },
  ],
} as never;

let store: ReturnType<typeof useDailyRewardStore>;
let refreshPet: MockInstance;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  store = useDailyRewardStore();
  refreshPet = vi.spyOn(usePetStore(), 'loadState').mockResolvedValue();

  mockedLoad.mockResolvedValue(rewardState);
});

describe('daily reward store', () => {
  it('loads the reward state', async () => {
    await store.load();

    expect(store.state).toEqual(rewardState);
    expect(store.loading).toBe(false);
  });

  it('reports load failures', async () => {
    mockedLoad.mockRejectedValue(new Error('offline'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.load();

    expect(fail).toHaveBeenCalledWith('offline');
    expect(store.loading).toBe(false);
  });

  it('claims a reward with coins and an item', async () => {
    mockedClaim.mockResolvedValue({
      rewardCoins: '70',
      itemGranted: { id: 'food-1' },
    } as never);

    await store.claim();

    expect(useUiStore().alerts.at(-1)?.message).toContain('+70 монет');
    expect(useUiStore().alerts.at(-1)?.message).toContain('и предмет');
    expect(mockedLoad).toHaveBeenCalled();
    expect(refreshPet).toHaveBeenCalledWith({ silent: true });
    expect(store.claiming).toBe(false);
  });

  it('claims a reward without an item', async () => {
    mockedClaim.mockResolvedValue({
      rewardCoins: '70',
      itemGranted: null,
    } as never);

    await store.claim();

    expect(useUiStore().alerts.at(-1)?.message).toBe(
      'Ежедневная награда: +70 монет.',
    );
  });

  it('reports claim failures and resets the busy flag', async () => {
    mockedClaim.mockRejectedValue(new Error('already claimed'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.claim();

    expect(fail).toHaveBeenCalledWith('already claimed');
    expect(store.claiming).toBe(false);
  });

  it('resets the state', async () => {
    await store.load();

    store.reset();

    expect(store.state).toBeNull();
  });
});
