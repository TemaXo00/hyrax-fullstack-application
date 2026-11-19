import { useDailyRewardStore } from '@org/api-client';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRef } from 'vue';

import { useDailyReward } from './useDailyReward';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('useDailyReward', () => {
  it('exposes refs and delegates actions', async () => {
    const store = useDailyRewardStore();

    const load = vi.spyOn(store, 'load').mockResolvedValue();
    const claim = vi.spyOn(store, 'claim').mockResolvedValue();
    const reset = vi.spyOn(store, 'reset');

    const reward = useDailyReward();

    expect(isRef(reward.state)).toBe(true);
    expect(isRef(reward.claiming)).toBe(true);

    await reward.load();
    await reward.claim();
    reward.reset();

    expect(load).toHaveBeenCalledTimes(1);
    expect(claim).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
