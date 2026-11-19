import { useLeaderboardStore } from '@org/api-client';
import { storeToRefs } from 'pinia';

import type { StoreRefs } from './store-refs';

type LeaderboardStore = ReturnType<typeof useLeaderboardStore>;

export function useLeaderboard(): StoreRefs<LeaderboardStore> &
  Pick<
    LeaderboardStore,
    'load' | 'loadMyPosition' | 'setMetric' | 'goToPage' | 'reset'
  > {
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
