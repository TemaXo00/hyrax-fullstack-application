<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@org/api-client';
import AppButton from '../ui/AppButton.vue';
import AppIcon from '../ui/AppIcon.vue';
import ProgressBar from '../ui/ProgressBar.vue';

import type { AchievementProgress } from '@org/api-client';

const props = defineProps<{
  achievement: AchievementProgress;
  loading: boolean;
}>();

defineEmits<{ claim: [] }>();

const icon = computed(() => {
  switch (props.achievement.conditionType) {
    case 'TOTAL_FEEDS':
      return 'bowl';
    case 'LEVEL':
    case 'STREAK':
      return 'star';
    case 'TOTAL_COINS_EARNED':
      return 'coin';
    default:
      return 'paw';
  }
});

const percent = computed(() =>
  Math.min(
    100,
    (props.achievement.progress / Math.max(1, props.achievement.conditionValue)) * 100,
  ),
);
</script>

<template>
  <article
    :class="[
      'flex items-start gap-3 rounded-[24px] border p-4 transition',
      achievement.isUnlocked && !achievement.isClaimed
        ? 'border-moss/50 bg-[#eef2e6]'
        : 'border-ink/15 bg-paper/85',
    ]"
  >
    <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream text-ink/70">
      <AppIcon
        :name="icon"
        :size="20"
      />
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="text-sm font-extrabold text-ink">{{ achievement.title }}</h3>
          <p class="mt-0.5 text-[11px] leading-relaxed text-muted">
            {{ achievement.description }}
          </p>
        </div>
        <span class="shrink-0 rounded-full bg-butter/60 px-2 py-1 text-[10px] font-bold text-ink/70">
          +{{ formatNumber(achievement.rewardCoins) }}
        </span>
      </div>

      <div class="mt-2.5">
        <div class="mb-1 flex items-center justify-between text-[10px] font-semibold text-muted">
          <span>{{ achievement.conditionTypeLabel }}</span>
          <span>{{ Math.min(achievement.progress, achievement.conditionValue) }} / {{ achievement.conditionValue }}</span>
        </div>
        <ProgressBar
          :value="percent"
          :tone="achievement.isClaimed ? 'moss' : achievement.isUnlocked ? 'moss' : 'butter'"
          compact
        />
      </div>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-2">
      <span
        v-if="achievement.isClaimed"
        class="flex items-center gap-1 rounded-full bg-moss/15 px-2 py-1 text-[10px] font-bold text-moss-dark"
      >
        <AppIcon
          name="check"
          :size="12"
        />
        получено
      </span>
      <AppButton
        v-else-if="achievement.isUnlocked"
        size="sm"
        :loading="loading"
        @click="$emit('claim')"
      >
        Забрать
      </AppButton>
      <span
        v-else
        class="flex items-center gap-1 rounded-full bg-ink/10 px-2 py-1 text-[10px] font-semibold text-ink/50"
      >
        <AppIcon
          name="lock"
          :size="11"
        />
        закрыто
      </span>
    </div>
  </article>
</template>
