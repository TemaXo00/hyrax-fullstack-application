import { defineStore } from 'pinia';
import { ref } from 'vue';

import { claimAchievement, getAchievements } from '../achievements.api';
import { getApiErrorMessage } from '../http';
import { usePetStore } from './pet.store';
import { useUiStore } from './ui.store';

import type { Serialized } from '../types';
import type {
  AchievementCondition,
  AchievementProgressEntity,
  PaginationMeta,
} from '@org/types';

export type AchievementProgress = Serialized<AchievementProgressEntity>;

export const useAchievementsStore = defineStore('achievements', () => {
  const items = ref<AchievementProgress[]>([]);
  const pagination = ref<PaginationMeta | null>(null);
  const page = ref(1);
  const conditionType = ref<AchievementCondition | null>(null);
  const loading = ref(false);
  const claimingId = ref<string | null>(null);

  async function load(): Promise<void> {
    loading.value = true;

    try {
      const result = await getAchievements({
        page: page.value,
        limit: 30,
        ...(conditionType.value ? { conditionType: conditionType.value } : {}),
      });

      items.value = result.achievements;
      pagination.value = result.pagination;
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      loading.value = false;
    }
  }

  async function claim(id: string): Promise<void> {
    claimingId.value = id;

    try {
      const result = await claimAchievement(id);

      useUiStore().notify(
        `Награда получена: +${result.rewardCoins} монет · ${result.achievement.title}`,
      );
      await Promise.all([load(), usePetStore().loadState({ silent: true })]);
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      claimingId.value = null;
    }
  }

  function setCondition(next: AchievementCondition | null): void {
    conditionType.value = next;
    page.value = 1;
  }

  function reset(): void {
    items.value = [];
    pagination.value = null;
    page.value = 1;
    conditionType.value = null;
    claimingId.value = null;
  }

  return {
    items,
    pagination,
    page,
    conditionType,
    loading,
    claimingId,
    load,
    claim,
    setCondition,
    reset,
  };
});
