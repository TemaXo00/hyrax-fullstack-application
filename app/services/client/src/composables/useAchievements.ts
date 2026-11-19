import { storeToRefs } from 'pinia';
import { useAchievementsStore } from '@org/api-client';

export function useAchievements() {
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
