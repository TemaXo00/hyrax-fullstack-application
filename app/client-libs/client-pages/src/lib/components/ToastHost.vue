<script setup lang="ts">
import { useUiStore } from '@org/api-client';
import { AppIcon } from '@org/client-ui';
import { storeToRefs } from 'pinia';

const ui = useUiStore();
const { alerts } = storeToRefs(ui);
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4"
  >
    <TransitionGroup name="toast">
      <button
        v-for="alert in alerts"
        :key="alert.id"
        type="button"
        :class="[
          'pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm font-medium shadow-lg',
          alert.tone === 'error'
            ? 'border-clay/40 bg-[#f9e4df] text-[#7a3d31]'
            : alert.tone === 'success'
              ? 'border-moss/40 bg-[#e9f0e0] text-[#405a32]'
              : 'border-ink/15 bg-paper text-ink',
        ]"
        @click="ui.dismiss(alert.id)"
      >
        <span class="mt-0.5">
          <AppIcon
            :name="
              alert.tone === 'error'
                ? 'close'
                : alert.tone === 'success'
                  ? 'check'
                  : 'sparkles'
            "
            :size="15"
          />
        </span>
        <span>{{ alert.message }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
