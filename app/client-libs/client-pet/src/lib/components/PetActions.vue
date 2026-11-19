<script setup lang="ts">
import { AppButton, AppIcon } from '@org/client-ui';
import { computed } from 'vue';

const props = defineProps<{
  pendingClicks: number;
  cooldownSeconds: number;
  busy: boolean;
  clickReward: number;
}>();

defineEmits<{
  walk: [];
  feed: [];
  pet: [];
}>();

const walkLabel = computed(() => {
  if (props.cooldownSeconds > 0) {
    return `Отдых ${props.cooldownSeconds} с`;
  }

  if (props.pendingClicks > 0) {
    return `Погулять · ${props.pendingClicks}`;
  }

  return 'Погулять';
});
</script>

<template>
  <div class="grid gap-2.5">
    <AppButton
      size="lg"
      block
      :loading="busy"
      :disabled="cooldownSeconds > 0 || pendingClicks < 1"
      @click="$emit('walk')"
    >
      <AppIcon name="leaf" :size="18" />
      {{ walkLabel }}
      <span
        class="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      >
        free
      </span>
    </AppButton>

    <div class="grid grid-cols-2 gap-2.5">
      <AppButton variant="soft" @click="$emit('feed')">
        <AppIcon name="bowl" :size="17" />
        Покормить
      </AppButton>
      <AppButton variant="lilac" @click="$emit('pet')">
        <AppIcon name="heart" :size="17" />
        Погладить +{{ clickReward }}
      </AppButton>
    </div>
  </div>
</template>
