<script setup lang="ts">
import { formatNumber } from '@org/client-core';

import AppIcon from './AppIcon.vue';

withDefaults(
  defineProps<{
    value: number | string;
    size?: 'sm' | 'md';
    action?: boolean;
  }>(),
  { size: 'md', action: false },
);

defineEmits<{ action: [] }>();
</script>

<template>
  <div
    :class="[
      'inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper/95 font-bold text-ink shadow-[0_3px_0_rgba(88,70,45,0.1)]',
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
    ]"
  >
    <span
      :class="[
        'grid place-items-center rounded-full bg-butter text-ink',
        size === 'sm' ? 'size-5' : 'size-6',
      ]"
    >
      <AppIcon name="coin" :size="size === 'sm' ? 13 : 15" />
    </span>
    <span class="tabular-nums">{{ formatNumber(value) }}</span>
    <button
      v-if="action"
      type="button"
      class="ml-0.5 grid size-5 place-items-center rounded-full bg-ink/10 text-ink/70 transition hover:bg-ink/15"
      aria-label="Открыть магазин"
      @click="$emit('action')"
    >
      <AppIcon name="plus" :size="12" />
    </button>
  </div>
</template>
