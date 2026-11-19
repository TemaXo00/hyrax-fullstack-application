<script setup lang="ts">
import { formatNumber } from '@org/client-core';
import { AppIcon, ProgressBar } from '@org/client-ui';

defineProps<{
  level: number;
  xp: number;
  xpToNextLevel: number;
  xpPercent: number;
  mood: number;
  hunger: number;
  clickReward: number;
  autoIncome: number;
}>();
</script>

<template>
  <div
    class="rounded-[26px] border border-ink/15 bg-paper/90 p-4 shadow-[0_8px_22px_rgba(88,70,45,0.07)]"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span
          class="grid size-9 place-items-center rounded-full bg-ink text-xs font-bold text-paper"
        >
          {{ level }}
        </span>
        <div>
          <p class="text-sm font-bold leading-none text-ink">
            Уровень {{ level }}
          </p>
          <p class="mt-1 text-[11px] text-muted">
            {{ formatNumber(xp) }} / {{ formatNumber(xpToNextLevel) }} XP
          </p>
        </div>
      </div>
      <div
        class="flex items-center gap-1.5 text-[11px] font-semibold text-muted"
      >
        <AppIcon name="sparkles" :size="14" />
        <span>+{{ formatNumber(clickReward) }} за клик</span>
      </div>
    </div>

    <div class="mt-3">
      <ProgressBar :value="xpPercent" tone="lilac" compact />
    </div>

    <div class="mt-4 grid grid-cols-2 gap-4">
      <div>
        <div
          class="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
        >
          <span class="flex items-center gap-1">
            <AppIcon name="heart" :size="13" />
            Настроение
          </span>
          <span class="text-ink/60">{{ Math.round(mood) }}</span>
        </div>
        <ProgressBar :value="mood" tone="clay" />
      </div>
      <div>
        <div
          class="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
        >
          <span class="flex items-center gap-1">
            <AppIcon name="bowl" :size="13" />
            Сытость
          </span>
          <span class="text-ink/60">{{ Math.round(hunger) }}</span>
        </div>
        <ProgressBar :value="hunger" tone="moss" />
      </div>
    </div>

    <div
      v-if="autoIncome > 0"
      class="mt-4 flex items-center gap-2 rounded-xl bg-cream/80 px-3 py-2 text-[11px] font-semibold text-ink/70"
    >
      <AppIcon name="clock" :size="14" />
      Автодоход: +{{ autoIncome }} монет в минуту
    </div>
  </div>
</template>
