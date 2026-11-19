<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T;
  options: Array<{ value: T; label: string }>;
  size?: 'sm' | 'md';
}>();

defineEmits<{ 'update:modelValue': [value: T] }>();
</script>

<template>
  <div
    class="inline-flex flex-wrap gap-1 rounded-full border border-ink/10 bg-cream/70 p-1"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="[
        'rounded-full font-semibold transition',
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs',
        modelValue === option.value
          ? 'bg-paper text-ink shadow-[0_2px_0_rgba(88,70,45,0.1)]'
          : 'text-muted hover:text-ink',
      ]"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
