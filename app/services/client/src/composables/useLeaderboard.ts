import { storeToRefs } from 'pinia';
import { useLeaderboardStore } from '@org/api-client';

export function useLeaderboard() {
  const store = useLeaderboardStore();
  const refs = storeToRefs(store);

  return {
    ...refs,
    load: store.load,
    loadMyPosition: store.loadMyPosition,
    setMetric: store.setMetric,
    goToPage: store.goToPage,
    reset: store.reset,
  };
}
