<script setup lang="ts">
import AppIcon from './AppIcon.vue';

defineProps<{
  page: number;
  totalPages: number;
}>();

defineEmits<{ change: [page: number] }>();
</script>

<template>
  <div
    v-if="totalPages > 1"
    class="mt-4 flex items-center justify-center gap-3"
  >
    <button
      type="button"
      class="grid size-8 place-items-center rounded-full border border-ink/15 bg-paper text-ink/70 transition hover:bg-cream disabled:opacity-40"
      :disabled="page <= 1"
      aria-label="Предыдущая страница"
      @click="$emit('change', page - 1)"
    >
      <AppIcon name="arrow-left" :size="14" />
    </button>
    <span class="text-xs font-semibold text-muted"
      >{{ page }} / {{ totalPages }}</span
    >
    <button
      type="button"
      class="grid size-8 place-items-center rounded-full border border-ink/15 bg-paper text-ink/70 transition hover:bg-cream disabled:opacity-40"
      :disabled="page >= totalPages"
      aria-label="Следующая страница"
      @click="$emit('change', page + 1)"
    >
      <AppIcon name="arrow-right" :size="14" />
    </button>
  </div>
</template>
