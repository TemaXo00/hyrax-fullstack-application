<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ACHIEVEMENT_CONDITIONS, ACHIEVEMENT_CONDITION_LABELS } from '@org/types';
import AchievementItem from '../components/achievements/AchievementItem.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import PageTitle from '../components/ui/PageTitle.vue';
import SegmentedControl from '../components/ui/SegmentedControl.vue';
import { useAchievements } from '../composables/useAchievements';

import type { AchievementCondition } from '@org/types';

type Filter = AchievementCondition | 'ALL';

const { items, loading, claimingId, load, claim, setCondition } = useAchievements();
const filter = ref<Filter>('ALL');

const options: Array<{ value: Filter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  ...ACHIEVEMENT_CONDITIONS.map((condition) => ({
    value: condition,
    label: ACHIEVEMENT_CONDITION_LABELS[condition],
  })),
];

const claimedCount = computed(() => items.value.filter((item) => item.isClaimed).length);
const unlockedCount = computed(
  () => items.value.filter((item) => item.isUnlocked && !item.isClaimed).length,
);

function applyFilter(value: Filter): void {
  filter.value = value;
  setCondition(value === 'ALL' ? null : value);
  void load();
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div>
    <PageTitle
      title="Достижения"
      subtitle="Маленькие цели и награды за заботу о питомце."
    >
      <template #aside>
        <div class="rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-xs font-bold text-ink/70">
          {{ claimedCount }} получено
        </div>
      </template>
    </PageTitle>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <SegmentedControl
        :model-value="filter"
        :options="options"
        size="sm"
        @update:model-value="applyFilter"
      />
      <p class="text-[11px] font-medium text-muted">
        Доступно к получению: {{ unlockedCount }}
      </p>
    </div>

    <div
      v-if="loading && items.length === 0"
      class="grid gap-3 lg:grid-cols-2"
    >
      <div
        v-for="index in 4"
        :key="index"
        class="h-28 animate-pulse rounded-[24px] border border-ink/10 bg-paper/60"
      />
    </div>

    <EmptyState
      v-else-if="items.length === 0"
      icon="trophy"
      title="Пока нет достижений"
      description="Новые цели появятся, когда каталог будет заполнен."
    />

    <div
      v-else
      class="grid gap-3 lg:grid-cols-2"
    >
      <AchievementItem
        v-for="achievement in items"
        :key="achievement.id"
        :achievement="achievement"
        :loading="claimingId === achievement.id"
        @claim="claim(achievement.id)"
      />
    </div>
  </div>
</template>
