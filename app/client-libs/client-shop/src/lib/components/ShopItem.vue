<script setup lang="ts">
import { AppButton, CoinPill } from '@org/client-ui';

withDefaults(
  defineProps<{
    title: string;
    description?: string | null;
    glyph: string;
    price?: number | null;
    actionLabel: string;
    badge?: string;
    tone?: 'paper' | 'lilac' | 'moss';
    disabled?: boolean;
    loading?: boolean;
    preview?: string;
    glyphStyle?: string;
  }>(),
  { price: null, tone: 'paper', disabled: false, loading: false },
);

defineEmits<{ action: [] }>();
</script>

<template>
  <article
    class="flex h-full flex-col rounded-[24px] border border-ink/15 bg-paper/90 p-4 shadow-[0_6px_16px_rgba(88,70,45,0.06)]"
  >
    <div class="flex items-start gap-3">
      <span
        class="grid size-12 shrink-0 place-items-center rounded-2xl border border-ink/10 text-2xl"
        :class="
          tone === 'moss'
            ? 'bg-[#e9efe0]'
            : tone === 'lilac'
              ? 'bg-lilac/60'
              : 'bg-cream'
        "
        :style="glyphStyle ? { background: glyphStyle } : undefined"
      >
        {{ glyph }}
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-sm font-extrabold leading-snug text-ink">
            {{ title }}
          </h3>
          <span
            v-if="badge"
            class="shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-semibold text-ink/60"
          >
            {{ badge }}
          </span>
        </div>
        <p
          v-if="description"
          class="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div
      v-if="preview"
      class="mt-3 h-20 rounded-2xl border border-ink/10"
      :style="{ background: preview }"
    />

    <div class="mt-3 flex-1">
      <slot />
    </div>

    <div
      class="mt-3 flex items-center justify-between gap-2 border-t border-ink/10 pt-3"
    >
      <CoinPill v-if="price !== null" :value="price" size="sm" />
      <span v-else class="text-[11px] font-semibold text-muted">
        в коллекции
      </span>
      <AppButton
        size="sm"
        :variant="tone === 'moss' ? 'primary' : 'soft'"
        :disabled="disabled"
        :loading="loading"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </AppButton>
    </div>
  </article>
</template>
