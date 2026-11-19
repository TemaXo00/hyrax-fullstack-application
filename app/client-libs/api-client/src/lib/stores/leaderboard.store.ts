import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getApiErrorMessage } from '../http';
import {
  getLeaderboard,
  getMyLeaderboardPosition,
} from '../leaderboard.api';
import { useUiStore } from './ui.store';

import type {
  LeaderboardPosition,
  PaginatedLeaderboard,
} from '../leaderboard.api';
import type { LeaderboardMetric, PaginationMeta } from '@org/types';

export const LEADERBOARD_METRICS: Array<{
  value: LeaderboardMetric;
  label: string;
  short: string;
}> = [
  { value: 'TOTAL_COINS_EARNED', label: 'Всего заработано монет', short: 'Монеты' },
  { value: 'TOTAL_CLICKS', label: 'Всего кликов', short: 'Клики' },
  { value: 'PET_LEVEL', label: 'Уровень питомца', short: 'Уровень' },
  { value: 'STREAK', label: 'Серия входов', short: 'Серия' },
];

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const metric = ref<LeaderboardMetric>('TOTAL_COINS_EARNED');
  const page = ref(1);
  const board = ref<PaginatedLeaderboard | null>(null);
  const myPosition = ref<LeaderboardPosition | null>(null);
  const loading = ref(false);
  const pagination = ref<PaginationMeta | null>(null);

  async function load(): Promise<void> {
    loading.value = true;

    try {
      const result = await getLeaderboard({
        page: page.value,
        limit: 10,
        metric: metric.value,
      });

      board.value = result;
      pagination.value = result.pagination;
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    } finally {
      loading.value = false;
    }
  }

  async function loadMyPosition(): Promise<void> {
    try {
      myPosition.value = await getMyLeaderboardPosition(metric.value);
    } catch (requestError) {
      useUiStore().fail(getApiErrorMessage(requestError));
    }
  }

  async function setMetric(next: LeaderboardMetric): Promise<void> {
    metric.value = next;
    page.value = 1;
    await Promise.all([load(), loadMyPosition()]);
  }

  async function goToPage(next: number): Promise<void> {
    page.value = Math.max(1, next);
    await load();
  }

  function reset(): void {
    board.value = null;
    myPosition.value = null;
    pagination.value = null;
    metric.value = 'TOTAL_COINS_EARNED';
    page.value = 1;
  }

  return {
    metric,
    page,
    board,
    myPosition,
    pagination,
    loading,
    load,
    loadMyPosition,
    setMetric,
    goToPage,
    reset,
  };
});
