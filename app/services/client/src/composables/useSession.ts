import {
  useAchievementsStore,
  useAuthStore,
  useDailyRewardStore,
  useLeaderboardStore,
  usePetStore,
  useShopStore,
  useUiStore,
} from '@org/api-client';
import { useRouter } from 'vue-router';

export function useSession() {
  const auth = useAuthStore();
  const router = useRouter();

  function resetGame(): void {
    usePetStore().reset();
    useShopStore().reset();
    useAchievementsStore().reset();
    useDailyRewardStore().reset();
    useLeaderboardStore().reset();
    useUiStore().clear();
  }

  async function logout(): Promise<void> {
    try {
      await auth.logout();
    } finally {
      resetGame();
      await router.push({ name: 'Login' });
    }
  }

  return { auth, logout, resetGame };
}
