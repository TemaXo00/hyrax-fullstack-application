<script setup lang="ts">
import { getFoodGlyph } from '@org/client-core';
import { AppButton, EmptyState, ModalDialog } from '@org/client-ui';
import { computed, ref } from 'vue';

import type { PetState } from '@org/api-client';

const props = defineProps<{
  open: boolean;
  inventory: PetState['foodInventory'];
  busy: boolean;
}>();

const emit = defineEmits<{
  feed: [foodId: string];
  close: [];
}>();

const selectedId = ref<string | null>(null);

const activeId = computed(
  () => selectedId.value ?? props.inventory[0]?.food.id ?? '',
);

const activeItem = computed(
  () => props.inventory.find((item) => item.food.id === activeId.value) ?? null,
);

function submit(): void {
  if (activeId.value) {
    emit('feed', activeId.value);
  }
}
</script>

<template>
  <ModalDialog
    :open="open"
    title="Покормить питомца"
    description="Одна порция из инвентаря."
    @close="$emit('close')"
  >
    <EmptyState
      v-if="inventory.length === 0"
      icon="bowl"
      title="Инвентарь пуст"
      description="Купите еду в магазине, чтобы угостить питомца."
    />

    <template v-else>
      <div class="max-h-64 space-y-2 overflow-auto pr-1">
        <button
          v-for="item in inventory"
          :key="item.id"
          type="button"
          :class="[
            'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition',
            item.food.id === activeId
              ? 'border-moss bg-[#eef2e6]'
              : 'border-ink/10 bg-cream/70 hover:bg-cream',
          ]"
          @click="selectedId = item.food.id"
        >
          <span
            class="grid size-10 place-items-center rounded-xl bg-paper text-xl"
          >
            {{ getFoodGlyph(item.food.name) }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-ink">{{
              item.food.name
            }}</span>
            <span class="block text-[11px] text-muted">
              +{{ item.food.hungerRestore }} сытости · +{{
                item.food.moodBonus
              }}
              настроения
            </span>
          </span>
          <span
            class="rounded-full bg-ink/10 px-2 py-1 text-[11px] font-semibold text-ink/70"
          >
            ×{{ item.quantity }}
          </span>
        </button>
      </div>

      <AppButton
        block
        class="mt-4"
        :loading="busy"
        :disabled="!activeItem"
        @click="submit"
      >
        Скормить {{ activeItem?.food.name ?? 'угощение' }}
      </AppButton>
    </template>
  </ModalDialog>
</template>
