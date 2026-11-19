<script setup lang="ts">
import AppIcon from './AppIcon.vue';

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    back?: boolean;
  }>(),
  { back: false },
);

defineEmits<{ back: [] }>();
</script>

<template>
  <div class="mb-5 flex items-start gap-3">
    <button
      v-if="back"
      type="button"
      class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-ink/15 bg-paper text-ink/75 transition hover:bg-cream"
      aria-label="Назад"
      @click="$emit('back')"
    >
      <AppIcon
        name="arrow-left"
        :size="17"
      />
    </button>
    <div class="min-w-0">
      <h1 class="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="mt-1 text-sm text-muted"
      >
        {{ subtitle }}
      </p>
    </div>
    <div class="ml-auto shrink-0">
      <slot name="aside" />
    </div>
  </div>
</template>
