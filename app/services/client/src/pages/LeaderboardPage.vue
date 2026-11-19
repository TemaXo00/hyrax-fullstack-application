<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { LEADERBOARD_METRICS, useAuthStore } from '@org/api-client';
import LeaderboardList from '../components/leaderboard/LeaderboardList.vue';
import PageTitle from '../components/ui/PageTitle.vue';
import SegmentedControl from '../components/ui/SegmentedControl.vue';
import { useLeaderboard } from '../composables/useLeaderboard';

import type { LeaderboardMetric } from '@org/types';

const auth = useAuthStore();
const { nickname } = storeToRefs(auth);
const { board, myPosition, metric, loading, load, loadMyPosition, setMetric, goToPage } =
  useLeaderboard();

const options = LEADERBOARD_METRICS.map((entry) => ({
  value: entry.value,
  label: entry.short,
}));

function changeMetric(value: LeaderboardMetric): void {
  void setMetric(value);
}

onMounted(() => {
  void Promise.all([load(), loadMyPosition()]);
});
</script>

<template>
  <div>
    <PageTitle
      title="Рейтинг"
      subtitle="Игроки, которые лучше всех заботятся о питомцах."
    >
      <template #aside>
        <div class="rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-xs font-bold text-ink/70">
          {{ board?.metricLabel ?? 'Монеты' }}
        </div>
      </template>
    </PageTitle>

    <div class="mb-4">
      <SegmentedControl
        :model-value="metric"
        :options="options"
        size="sm"
        @update:model-value="changeMetric"
      />
    </div>

    <LeaderboardList
      :board="board"
      :my-position="myPosition"
      :current-nickname="nickname"
      :loading="loading"
      @change="goToPage"
    />
  </div>
</template>
