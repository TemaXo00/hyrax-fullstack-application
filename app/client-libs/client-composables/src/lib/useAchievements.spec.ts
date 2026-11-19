import { useAchievementsStore } from '@org/api-client';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRef } from 'vue';

import { useAchievements } from './useAchievements';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('useAchievements', () => {
  it('exposes refs and delegates actions', async () => {
    const store = useAchievementsStore();

    const load = vi.spyOn(store, 'load').mockResolvedValue();
    const claim = vi.spyOn(store, 'claim').mockResolvedValue();
    const setCondition = vi.spyOn(store, 'setCondition');
    const reset = vi.spyOn(store, 'reset');

    const achievements = useAchievements();

    expect(isRef(achievements.items)).toBe(true);
    expect(isRef(achievements.loading)).toBe(true);

    await achievements.load();
    await achievements.claim('achievement-1');
    achievements.setCondition('LEVEL');
    achievements.reset();

    expect(load).toHaveBeenCalledTimes(1);
    expect(claim).toHaveBeenCalledWith('achievement-1');
    expect(setCondition).toHaveBeenCalledWith('LEVEL');
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
