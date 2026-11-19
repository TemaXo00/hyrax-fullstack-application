<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean;
    tone?: 'paper' | 'cream' | 'lilac';
  }>(),
  { padded: true, tone: 'paper' },
);
</script>

<template>
  <section
    :class="[
      'rounded-[28px] border border-ink/15 shadow-[0_10px_28px_rgba(88,70,45,0.08)]',
      tone === 'cream'
        ? 'bg-cream/85'
        : tone === 'lilac'
          ? 'bg-lilac/45'
          : 'bg-paper/90',
      padded ? 'p-5 sm:p-6' : '',
    ]"
  >
    <slot />
  </section>
</template>
