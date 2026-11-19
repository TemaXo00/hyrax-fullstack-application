<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { usePetGame } from '../../composables/usePetGame';
import { useNow } from '../../composables/useNow';
import { getCosmeticGlyph, getRoomTheme } from '../../utils/visuals';
import AppIcon from '../ui/AppIcon.vue';
import PetSprite from './PetSprite.vue';

const emit = defineEmits<{ editName: [] }>();

const {
  pet,
  speciesMeta,
  clickReward,
  clickLimitLeft,
  click,
  equippedBackground,
  equippedHat,
  equippedAccessory,
} = usePetGame();

const now = useNow(500);
const pouncing = ref(false);
const floats = ref<Array<{ id: number; x: number; y: number; amount: number }>>(
  [],
);
let floatId = 0;
let pounceTimer: ReturnType<typeof setTimeout> | null = null;

const theme = computed(() => getRoomTheme(equippedBackground.value?.name ?? null));

const equippedItems = computed(() =>
  [equippedHat.value, equippedAccessory.value].filter(
    (item): item is NonNullable<typeof item> => Boolean(item),
  ),
);

function onPetClick(event: MouseEvent): void {
  if (clickLimitLeft(now.value) <= 0) {
    return;
  }

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const id = ++floatId;

  floats.value = [
    ...floats.value.slice(-5),
    {
      id,
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      amount: clickReward.value,
    },
  ];

  pouncing.value = false;

  if (pounceTimer) {
    clearTimeout(pounceTimer);
  }

  pounceTimer = setTimeout(() => {
    pouncing.value = true;
  }, 10);

  setTimeout(() => {
    floats.value = floats.value.filter((item) => item.id !== id);
  }, 900);

  void click();
}

onUnmounted(() => {
  if (pounceTimer) {
    clearTimeout(pounceTimer);
  }
});
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[32px] border border-ink/20 shadow-[0_16px_36px_rgba(88,70,45,0.12)]"
    :style="{ background: theme.sky, color: theme.ink }"
  >
    <div
      class="absolute inset-x-0 bottom-0 h-[34%]"
      :style="{ background: theme.floor }"
    />
    <div class="absolute inset-x-0 bottom-[34%] h-px bg-white/20" />
    <div class="absolute left-[12%] top-[38%] size-2 rounded-full bg-white/20" />
    <div class="absolute right-[18%] top-[26%] size-3 rounded-full bg-white/20" />
    <div class="absolute right-[10%] top-[48%] size-1.5 rounded-full bg-white/30" />

    <div class="relative flex min-h-[360px] flex-col items-center px-4 pb-9 pt-5 sm:min-h-[430px]">
      <div class="z-20 flex items-center gap-1.5 rounded-full border border-ink/20 bg-paper/95 px-4 py-1.5 shadow-[0_4px_0_rgba(88,70,45,0.1)]">
        <AppIcon
          name="sparkles"
          :size="14"
          class="text-butter"
        />
        <span class="max-w-44 truncate text-sm font-extrabold tracking-tight text-ink sm:text-base">
          {{ pet?.name ?? 'Питомец' }}
        </span>
        <button
          type="button"
          class="ml-1 grid size-6 place-items-center rounded-full border border-ink/15 bg-cream text-ink/60 transition hover:text-ink"
          aria-label="Переименовать питомца"
          @click="emit('editName')"
        >
          <AppIcon
            name="pencil"
            :size="12"
          />
        </button>
      </div>

      <div
        v-if="equippedItems.length > 0"
        class="absolute right-4 top-16 z-20 flex flex-col gap-1.5"
      >
        <span
          v-for="item in equippedItems"
          :key="item.id"
          class="flex items-center gap-1 rounded-full border border-white/25 bg-black/10 px-2 py-1 text-[10px] font-semibold backdrop-blur-[2px]"
        >
          <span>{{ getCosmeticGlyph(item.name, item.slot) }}</span>
          <span class="max-w-20 truncate">{{ item.name }}</span>
        </span>
      </div>

      <button
        type="button"
        class="relative z-10 mt-auto flex w-full items-end justify-center outline-none"
        aria-label="Погладить питомца"
        @click="onPetClick"
      >
        <div class="absolute bottom-2 h-4 w-[42%] max-w-56 rounded-[50%] bg-black/10 blur-sm" />
        <PetSprite
          :image="speciesMeta.image"
          :alt="speciesMeta.label"
          :pouncing="pouncing"
        />
      </button>

      <p class="relative z-10 mt-3 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold backdrop-blur-[2px]">
        {{ clickLimitLeft(now) > 0 ? 'Нажмите на питомца' : 'Питомец отдыхает' }}
      </p>

      <div class="pointer-events-none absolute inset-0 z-30">
        <span
          v-for="floater in floats"
          :key="floater.id"
          class="coin-float absolute -translate-x-1/2 text-sm font-extrabold text-butter drop-shadow-[0_1px_0_rgba(62,58,51,0.5)]"
          :style="{ left: `${floater.x}%`, top: `${floater.y}%` }"
        >
          +{{ floater.amount }}
        </span>
      </div>
    </div>

    <span class="absolute bottom-3 left-4 rounded-full bg-black/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
      {{ theme.label }}
    </span>
  </div>
</template>

<style scoped>
.coin-float {
  animation: coin-float 0.9s ease-out forwards;
}

@keyframes coin-float {
  0% {
    opacity: 0;
    transform: translate(-50%, 0) scale(0.8);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -8px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -52px) scale(0.95);
  }
}
</style>
