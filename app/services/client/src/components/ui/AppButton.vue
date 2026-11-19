<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'soft' | 'lilac' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    block: false,
  },
);

defineEmits<{ click: [event: MouseEvent] }>();

const variantClass = computed(() => {
  switch (props.variant) {
    case 'soft':
      return 'border-ink/20 bg-paper text-ink hover:bg-cream';
    case 'lilac':
      return 'border-ink/20 bg-lilac/80 text-ink hover:bg-lilac';
    case 'ghost':
      return 'border-transparent bg-transparent text-ink hover:bg-ink/5';
    case 'danger':
      return 'border-clay bg-clay text-white hover:brightness-95';
    default:
      return 'border-moss-dark/60 bg-moss text-white hover:bg-moss-dark';
  }
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3.5 py-2 text-xs';
    case 'lg':
      return 'px-6 py-3.5 text-base';
    default:
      return 'px-4.5 py-2.5 text-sm';
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold transition duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55',
      variantClass,
      sizeClass,
      block ? 'w-full' : '',
    ]"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      class="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
