import { usePetStore } from '@org/api-client';
import { storeToRefs } from 'pinia';

import type { StoreRefs } from './store-refs';

type PetStore = ReturnType<typeof usePetStore>;

export function usePetGame(): StoreRefs<PetStore> &
  Pick<
    PetStore,
    | 'loadState'
    | 'click'
    | 'walk'
    | 'feed'
    | 'rename'
    | 'setSpecies'
    | 'remainingWalkCooldown'
    | 'isWalkReady'
    | 'clickLimitLeft'
    | 'reset'
  > {
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
