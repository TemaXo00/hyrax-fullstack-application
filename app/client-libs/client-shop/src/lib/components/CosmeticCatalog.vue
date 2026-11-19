<script setup lang="ts">
import { usePetGame, useShopCatalog } from '@org/client-composables';
import { getCosmeticGlyph, getRoomTheme } from '@org/client-core';
import { EmptyState, Pager } from '@org/client-ui';
import { computed, ref } from 'vue';

import ShopItem from './ShopItem.vue';

import type { CosmeticSlot } from '@org/types';

type SlotFilter = CosmeticSlot | 'ALL';

const {
  cosmetics,
  cosmeticLoading,
  cosmeticPagination,
  cosmeticPage,
  buyAndEquipCosmetic,
  equipItem,
  loadCosmetics,
  busyId,
} = useShopCatalog();
const { coins, cosmeticInventory } = usePetGame();

const slot = ref<SlotFilter>('BACKGROUND');

const slots: Array<{ value: SlotFilter; label: string }> = [
  { value: 'BACKGROUND', label: 'Фоны' },
  { value: 'HAT', label: 'Шляпы' },
  { value: 'ACCESSORY', label: 'Аксессуары' },
  { value: 'ALL', label: 'Все' },
];

const ownedMap = computed(
  () =>
    new Map(
      cosmeticInventory.value.map((item) => [
        item.cosmetic.id,
        { equipped: item.isEquipped },
      ]),
    ),
);

const visible = computed(() =>
  slot.value === 'ALL'
    ? cosmetics.value
    : cosmetics.value.filter((item) => item.slot === slot.value),
);

function actionFor(id: string): {
  label: string;
  disabled: boolean;
  owned: boolean;
  equipped: boolean;
} {
  const owned = ownedMap.value.get(id);
  const item = cosmetics.value.find((entry) => entry.id === id);

  if (!owned) {
    return {
      label: item && coins.value >= item.price ? 'Купить' : 'Не хватает',
      disabled: !item || coins.value < item.price,
      owned: false,
      equipped: false,
    };
  }

  return {
    label: owned.equipped ? 'Снять' : 'Надеть',
    disabled: false,
    owned: true,
    equipped: owned.equipped,
  };
}

async function act(id: string): Promise<void> {
  const state = actionFor(id);

  if (!state.owned) {
    await buyAndEquipCosmetic(id);
    return;
  }

  await equipItem(id, !state.equipped);
}

async function changePage(page: number): Promise<void> {
  cosmeticPage.value = page;
  await loadCosmetics();
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap gap-1.5">
      <button
        v-for="entry in slots"
        :key="entry.value"
        type="button"
        :class="[
          'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
          slot === entry.value
            ? 'border-ink/20 bg-cream text-ink'
            : 'border-transparent text-muted hover:bg-cream/60',
        ]"
        @click="slot = entry.value"
      >
        {{ entry.label }}
      </button>
    </div>

    <div
      v-if="cosmeticLoading && cosmetics.length === 0"
      class="grid gap-3 sm:grid-cols-2"
    >
      <div
        v-for="index in 4"
        :key="index"
        class="h-52 animate-pulse rounded-[24px] border border-ink/10 bg-paper/60"
      />
    </div>

    <EmptyState
      v-else-if="visible.length === 0"
      icon="star"
      title="Ничего не найдено"
      description="В этой категории пока нет предметов."
    />

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <ShopItem
        v-for="item in visible"
        :key="item.id"
        :title="item.name"
        :description="item.description"
        :glyph="getCosmeticGlyph(item.name, item.slot)"
        :price="ownedMap.has(item.id) ? null : item.price"
        :badge="
          ownedMap.get(item.id)?.equipped
            ? 'надето'
            : ownedMap.has(item.id)
              ? 'куплено'
              : item.rarityLabel
        "
        :tone="ownedMap.get(item.id)?.equipped ? 'moss' : 'paper'"
        :preview="
          item.slot === 'BACKGROUND' ? getRoomTheme(item.name).sky : undefined
        "
        :action-label="actionFor(item.id).label"
        :disabled="actionFor(item.id).disabled"
        :loading="busyId === item.id"
        @action="act(item.id)"
      />
    </div>

    <Pager
      :page="cosmeticPage"
      :total-pages="cosmeticPagination?.totalPages ?? 1"
      @change="changePage"
    />
  </div>
</template>
