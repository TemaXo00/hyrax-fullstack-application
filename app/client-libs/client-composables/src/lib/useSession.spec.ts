import {
  useAchievementsStore,
  useAuthStore,
  useDailyRewardStore,
  useLeaderboardStore,
  usePetStore,
  useShopStore,
  useUiStore,
} from '@org/api-client';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSession } from './useSession';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  setActivePinia(createPinia());
  push.mockReset();
  push.mockResolvedValue(undefined);
});

describe('useSession', () => {
  it('resets every game store and clears alerts', () => {
    const pet = usePetStore();
    const shop = useShopStore();
    const achievements = useAchievementsStore();
    const reward = useDailyRewardStore();
    const leaderboard = useLeaderboardStore();
    const ui = useUiStore();

    const resets = [
      vi.spyOn(pet, 'reset'),
      vi.spyOn(shop, 'reset'),
      vi.spyOn(achievements, 'reset'),
      vi.spyOn(reward, 'reset'),
      vi.spyOn(leaderboard, 'reset'),
      vi.spyOn(ui, 'clear'),
    ];

    useSession().resetGame();

    for (const reset of resets) {
      expect(reset).toHaveBeenCalledTimes(1);
    }
  });

  it('logs out, resets the game and navigates to login', async () => {
    const auth = useAuthStore();
    const logout = vi.spyOn(auth, 'logout').mockResolvedValue();
    const reset = vi.spyOn(usePetStore(), 'reset');

    await useSession().logout();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({ name: 'Login' });
  });

  it('still resets and navigates when logout fails', async () => {
    const auth = useAuthStore();

    vi.spyOn(auth, 'logout').mockRejectedValue(new Error('offline'));
    const reset = vi.spyOn(usePetStore(), 'reset');

    await expect(useSession().logout()).rejects.toThrow('offline');
    expect(reset).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({ name: 'Login' });
  });
});
