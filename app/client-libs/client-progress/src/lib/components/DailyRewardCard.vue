<script setup lang="ts">
import { formatNumber } from '@org/client-core';
import { AppButton, AppIcon } from '@org/client-ui';
import { computed } from 'vue';

import type { DailyRewardState } from '@org/api-client';

const props = defineProps<{
  state: DailyRewardState | null;
  claiming: boolean;
}>();

defineEmits<{ claim: [] }>();

const days = computed(() =>
  [...(props.state?.rewards ?? [])].sort((a, b) => a.dayNumber - b.dayNumber),
);
</script>

<template>
  <div
    class="rounded-[26px] border border-ink/15 bg-paper/90 p-4 shadow-[0_8px_22px_rgba(88,70,45,0.07)]"
  >
    <div class="flex items-center justify-between gap-2">
      <div>
        <p class="text-sm font-extrabold text-ink">Ежедневная награда</p>
        <p class="mt-0.5 text-[11px] text-muted">
          Серия: {{ state?.currentStreak ?? 0 }} · лучшая:
          {{ state?.bestStreak ?? 0 }}
        </p>
      </div>
      <span
        class="grid size-9 place-items-center rounded-full bg-butter/60 text-ink"
      >
        <AppIcon name="sparkles" :size="17" />
      </span>
    </div>

    <div class="mt-3 grid grid-cols-7 gap-1">
      <div
        v-for="day in days"
        :key="day.id"
        :class="[
          'flex flex-col items-center gap-0.5 rounded-xl border px-0.5 py-1.5',
          day.dayNumber === state?.dayNumber && state?.canClaim
            ? 'border-moss bg-[#e9efe0]'
            : day.dayNumber <= (state?.currentStreak ?? 0)
              ? 'border-ink/10 bg-cream/70'
              : 'border-transparent bg-cream/40',
        ]"
      >
        <span class="text-[9px] font-semibold text-muted">{{
          day.dayNumber
        }}</span>
        <span class="text-[10px] font-extrabold text-ink">{{
          formatNumber(day.rewardCoins)
        }}</span>
        <span
          v-if="day.rewardItem"
          class="text-[9px]"
          aria-label="Предмет в награду"
          >★</span
        >
        <span v-else class="h-[11px]" />
      </div>
    </div>

    <AppButton
      v-if="state?.canClaim"
      block
      size="sm"
      class="mt-3"
      :loading="claiming"
      @click="$emit('claim')"
    >
      Забрать награду
    </AppButton>
    <p
      v-else
      class="mt-3 rounded-xl bg-cream/70 px-3 py-2 text-center text-[11px] font-semibold text-muted"
    >
      Награда за сегодня уже получена
    </p>
  </div>
</template>
