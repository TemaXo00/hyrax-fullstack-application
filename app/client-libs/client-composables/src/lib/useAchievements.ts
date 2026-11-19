import { useAchievementsStore } from '@org/api-client';
import { storeToRefs } from 'pinia';

import type { StoreRefs } from './store-refs';

type AchievementsStore = ReturnType<typeof useAchievementsStore>;

export function useAchievements(): StoreRefs<AchievementsStore> &
  Pick<AchievementsStore, 'load' | 'claim' | 'setCondition' | 'reset'> {
  const store = useAchievementsStore();
  const refs = storeToRefs(store);

  return {
    ...refs,
    load: store.load,
    claim: store.claim,
    setCondition: store.setCondition,
    reset: store.reset,
  };
}
