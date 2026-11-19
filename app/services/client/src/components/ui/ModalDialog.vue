<script setup lang="ts">
import AppIcon from './AppIcon.vue';

defineProps<{
  open: boolean;
  title: string;
  description?: string;
}>();

defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
        role="presentation"
        @click.self="$emit('close')"
      >
        <div
          class="w-full max-w-md rounded-t-[28px] border border-ink/20 bg-paper p-5 shadow-2xl sm:rounded-[28px] sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-ink">
                {{ title }}
              </h2>
              <p
                v-if="description"
                class="mt-1 text-sm text-muted"
              >
                {{ description }}
              </p>
            </div>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-full border border-ink/15 bg-cream text-ink/70 transition hover:bg-ink/5"
              aria-label="Закрыть"
              @click="$emit('close')"
            >
              <AppIcon
                name="close"
                :size="15"
              />
            </button>
          </div>
          <div class="mt-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
