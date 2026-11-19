import { defineStore } from 'pinia';
import { ref } from 'vue';

import { claimDailyReward, getDailyRewardState } from '../daily-reward.api';
import { getApiErrorMessage } from '../http';
import { usePetStore } from './pet.store';
import { useUiStore } from './ui.store';

import type { DailyRewardState } from '../daily-reward.api';

export const useDailyRewardStore = defineStore('dailyReward', () => {
  const state = ref<DailyRewardState | null>(null);
  const loading = ref(false);
  const claiming = ref(false);

  async function load(): Promise<void> {
    loading.value = true;

    try {
      state.value = await getDailyRewardState();
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      loading.value = false;
    }
  }

  async function claim(): Promise<void> {
    claiming.value = true;

    try {
      const result = await claimDailyReward();

      useUiStore().notify(
        `Ежедневная награда: +${result.rewardCoins} монет${result.itemGranted ? ' и предмет' : ''}.`,
      );
      await Promise.all([load(), usePetStore().loadState({ silent: true })]);
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      claiming.value = false;
    }
  }

  function reset(): void {
    state.value = null;
  }

  return { state, loading, claiming, load, claim, reset };
});
