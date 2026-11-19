<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    value: number;
    tone?: 'moss' | 'clay' | 'butter' | 'lilac';
    label?: string;
    valueText?: string;
    compact?: boolean;
  }>(),
  { tone: 'moss', compact: false },
);

const clamped = computed(() => Math.min(100, Math.max(0, props.value)));

const toneClass = computed(() => {
  switch (props.tone) {
    case 'clay':
      return 'bg-clay';
    case 'butter':
      return 'bg-butter';
    case 'lilac':
      return 'bg-[#a99ed0]';
    default:
      return 'bg-moss';
  }
});
</script>

<template>
  <div class="w-full">
    <div
      v-if="label || valueText"
      class="mb-1.5 flex items-baseline justify-between gap-2"
    >
      <span
        v-if="label"
        class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
      >
        {{ label }}
      </span>
      <span v-if="valueText" class="text-xs font-semibold text-ink/70">
        {{ valueText }}
      </span>
    </div>
    <div
      :class="[
        'overflow-hidden rounded-full bg-ink/10',
        compact ? 'h-2' : 'h-2.5',
      ]"
    >
      <div
        :class="[
          'h-full rounded-full transition-[width] duration-300',
          toneClass,
        ]"
        :style="{ width: `${clamped}%` }"
      />
    </div>
  </div>
</template>
