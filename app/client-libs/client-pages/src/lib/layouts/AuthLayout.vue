<script setup lang="ts">
import { AppIcon } from '@org/client-ui';

defineProps<{
  title: string;
  subtitle: string;
}>();
</script>

<template>
  <div
    class="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_420px] lg:gap-12 lg:px-6"
  >
    <div class="hidden lg:block">
      <div class="flex items-center gap-2">
        <span
          class="grid size-10 place-items-center rounded-full border border-ink/20 bg-paper text-ink"
        >
          <AppIcon name="paw" :size="21" />
        </span>
        <span class="text-xl font-extrabold tracking-tight text-ink"
          >Hyrax</span
        >
      </div>

      <h2
        class="mt-8 max-w-md text-4xl font-extrabold leading-[1.05] tracking-tight text-ink"
      >
        Маленький питомец,
        <br />
        большие монеты.
      </h2>
      <p class="mt-4 max-w-sm text-sm leading-relaxed text-muted">
        Гладьте питомца, кормите его и гуляйте вместе. Настроение влияет на
        доход, а забота открывает новые уровни.
      </p>

      <div
        class="relative mt-8 max-w-md overflow-hidden rounded-[32px] border border-ink/15 bg-[#efdfc6] shadow-[0_18px_40px_rgba(88,70,45,0.14)]"
      >
        <div class="absolute inset-x-0 bottom-0 h-24 bg-[#d9bd96]" />
        <div
          class="relative flex min-h-[320px] items-end justify-center px-6 pb-8"
        >
          <img
            src="/pets/hyrax.png"
            alt="Даман"
            class="h-56 w-auto object-contain drop-shadow-[0_14px_16px_rgba(92,68,42,0.18)]"
          />
        </div>
        <span
          class="absolute left-4 top-4 rounded-full bg-paper/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60"
        >
          тёплая комната
        </span>
      </div>
    </div>

    <div class="w-full">
      <div class="mb-6 flex items-center gap-2 lg:hidden">
        <span
          class="grid size-9 place-items-center rounded-full border border-ink/20 bg-paper text-ink"
        >
          <AppIcon name="paw" :size="18" />
        </span>
        <span class="text-lg font-extrabold tracking-tight text-ink"
          >Hyrax</span
        >
      </div>

      <div
        class="rounded-[28px] border border-ink/15 bg-paper/95 p-6 shadow-[0_16px_36px_rgba(88,70,45,0.1)] sm:p-7"
      >
        <h1 class="text-2xl font-extrabold tracking-tight text-ink">
          {{ title }}
        </h1>
        <p class="mt-1.5 text-sm text-muted">
          {{ subtitle }}
        </p>
        <div class="mt-6">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
