import { storeToRefs } from 'pinia';
import { usePetStore } from '@org/api-client';

export function usePetGame() {
  const store = usePetStore();
  const refs = storeToRefs(store);

  return {
    ...refs,
    loadState: store.loadState,
    click: store.click,
    walk: store.walk,
    feed: store.feed,
    rename: store.rename,
    setSpecies: store.setSpecies,
    remainingWalkCooldown: store.remainingWalkCooldown,
    isWalkReady: store.isWalkReady,
    clickLimitLeft: store.clickLimitLeft,
    reset: store.reset,
  };
}
