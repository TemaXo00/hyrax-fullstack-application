import { useLeaderboardStore } from '@org/api-client';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRef } from 'vue';

import { useLeaderboard } from './useLeaderboard';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('useLeaderboard', () => {
  it('exposes refs and delegates actions', async () => {
    const store = useLeaderboardStore();

    const load = vi.spyOn(store, 'load').mockResolvedValue();
    const loadMyPosition = vi
      .spyOn(store, 'loadMyPosition')
      .mockResolvedValue();
    const setMetric = vi.spyOn(store, 'setMetric').mockResolvedValue();
    const goToPage = vi.spyOn(store, 'goToPage').mockResolvedValue();
    const reset = vi.spyOn(store, 'reset');

    const leaderboard = useLeaderboard();

    expect(isRef(leaderboard.board)).toBe(true);
    expect(isRef(leaderboard.metric)).toBe(true);

    await leaderboard.load();
    await leaderboard.loadMyPosition();
    await leaderboard.setMetric('STREAK');
    await leaderboard.goToPage(2);
    leaderboard.reset();

    expect(load).toHaveBeenCalledTimes(1);
    expect(loadMyPosition).toHaveBeenCalledTimes(1);
    expect(setMetric).toHaveBeenCalledWith('STREAK');
    expect(goToPage).toHaveBeenCalledWith(2);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
