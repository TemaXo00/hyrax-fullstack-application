import { storeToRefs } from 'pinia';
import { useDailyRewardStore } from '@org/api-client';

export function useDailyReward() {
  const store = useDailyRewardStore();
  const refs = storeToRefs(store);

  return {
    ...refs,
    load: store.load,
    claim: store.claim,
    reset: store.reset,
  };
}
