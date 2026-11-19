<script setup lang="ts">
import AppIcon from './AppIcon.vue';

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    icon?: 'paw' | 'bag' | 'trophy' | 'star' | 'bowl';
  }>(),
  { icon: 'paw' },
);
</script>

<template>
  <div
    class="flex flex-col items-center rounded-[24px] border border-dashed border-ink/20 bg-cream/60 px-6 py-10 text-center"
  >
    <span
      class="grid size-11 place-items-center rounded-full bg-paper text-ink/60"
    >
      <AppIcon :name="icon" :size="21" />
    </span>
    <p class="mt-3 text-sm font-bold text-ink">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="mt-1 max-w-xs text-xs leading-relaxed text-muted"
    >
      {{ description }}
    </p>
  </div>
</template>
