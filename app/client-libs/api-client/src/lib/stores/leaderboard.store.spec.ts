import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLeaderboard, getMyLeaderboardPosition } from '../leaderboard.api';
import { LEADERBOARD_METRICS, useLeaderboardStore } from './leaderboard.store';
import { useUiStore } from './ui.store';

vi.mock('../leaderboard.api', () => ({
  getLeaderboard: vi.fn(),
  getMyLeaderboardPosition: vi.fn(),
}));

const mockedBoard = vi.mocked(getLeaderboard);
const mockedPosition = vi.mocked(getMyLeaderboardPosition);

const pagination = {
  page: 1,
  limit: 10,
  total: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const board = {
  entries: [
    {
      rank: 1,
      userId: 'user-1',
      nickname: 'Alina',
      petName: 'Авава',
      value: 120,
      isMe: false,
    },
  ],
  pagination,
} as never;

const position = {
  rank: 4,
  value: 40,
  metric: 'TOTAL_COINS_EARNED',
} as never;

let store: ReturnType<typeof useLeaderboardStore>;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  store = useLeaderboardStore();

  mockedBoard.mockResolvedValue(board);
  mockedPosition.mockResolvedValue(position);
});

describe('leaderboard store', () => {
  it('exposes metric options', () => {
    expect(LEADERBOARD_METRICS.map((metric) => metric.value)).toContain(
      'TOTAL_CLICKS',
    );
  });

  it('loads the board and my position', async () => {
    await store.load();
    await store.loadMyPosition();

    expect(mockedBoard).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      metric: 'TOTAL_COINS_EARNED',
    });
    expect(store.board).toEqual(board);
    expect(store.pagination).toEqual(pagination);
    expect(store.myPosition).toEqual(position);
    expect(store.loading).toBe(false);
  });

  it('reports board and position failures', async () => {
    mockedBoard.mockRejectedValue(new Error('offline'));
    mockedPosition.mockRejectedValue(new Error('offline position'));
    const fail = vi.spyOn(useUiStore(), 'fail');

    await store.load();
    await store.loadMyPosition();

    expect(fail).toHaveBeenCalledWith('offline');
    expect(fail).toHaveBeenCalledWith('offline position');
    expect(store.loading).toBe(false);
  });

  it('changes the metric, resets the page and reloads everything', async () => {
    store.page = 4;

    await store.setMetric('STREAK');

    expect(store.metric).toBe('STREAK');
    expect(store.page).toBe(1);
    expect(mockedBoard).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      metric: 'STREAK',
    });
    expect(mockedPosition).toHaveBeenCalledWith('STREAK');
  });

  it('paginates without going below the first page', async () => {
    await store.goToPage(3);
    expect(store.page).toBe(3);

    await store.goToPage(0);
    expect(store.page).toBe(1);
    expect(mockedBoard).toHaveBeenCalledTimes(2);
  });

  it('resets the store', async () => {
    await store.load();
    await store.loadMyPosition();
    store.page = 2;

    store.reset();

    expect(store.board).toBeNull();
    expect(store.myPosition).toBeNull();
    expect(store.pagination).toBeNull();
    expect(store.metric).toBe('TOTAL_COINS_EARNED');
    expect(store.page).toBe(1);
  });
});
