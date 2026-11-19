import { useDailyRewardStore } from '@org/api-client';
import { storeToRefs } from 'pinia';

import type { StoreRefs } from './store-refs';

type DailyRewardStore = ReturnType<typeof useDailyRewardStore>;

export function useDailyReward(): StoreRefs<DailyRewardStore> &
  Pick<DailyRewardStore, 'load' | 'claim' | 'reset'> {
  const store = useDailyRewardStore();
  const refs = storeToRefs(store);

  return {
    ...refs,
    load: store.load,
    claim: store.claim,
    reset: store.reset,
  };
}
