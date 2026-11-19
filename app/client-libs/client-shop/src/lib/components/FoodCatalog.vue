<script setup lang="ts">
import { useShopCatalog, usePetGame } from '@org/client-composables';
import { getFoodGlyph } from '@org/client-core';
import { EmptyState, Pager } from '@org/client-ui';
import { computed } from 'vue';

import ShopItem from './ShopItem.vue';

const {
  foods,
  foodLoading,
  foodPagination,
  foodPage,
  buyFoodItem,
  loadFoods,
  busyId,
} = useShopCatalog();
const { coins, foodInventory } = usePetGame();

const inventoryMap = computed(
  () =>
    new Map(foodInventory.value.map((item) => [item.food.id, item.quantity])),
);

async function changePage(page: number): Promise<void> {
  foodPage.value = page;
  await loadFoods();
}
</script>

<template>
  <div>
    <div
      v-if="foodLoading && foods.length === 0"
      class="grid gap-3 sm:grid-cols-2"
    >
      <div
        v-for="index in 4"
        :key="index"
        class="h-40 animate-pulse rounded-[24px] border border-ink/10 bg-paper/60"
      />
    </div>

    <EmptyState
      v-else-if="foods.length === 0"
      icon="bowl"
      title="Полки пока пусты"
      description="Еда появится здесь, когда каталог будет заполнен."
    />

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <ShopItem
        v-for="food in foods"
        :key="food.id"
        :title="food.name"
        :description="food.description"
        :glyph="getFoodGlyph(food.name)"
        :price="food.price"
        :badge="
          inventoryMap.get(food.id)
            ? `×${inventoryMap.get(food.id)}`
            : undefined
        "
        :action-label="coins >= food.price ? 'Купить' : 'Не хватает'"
        :disabled="coins < food.price"
        :loading="busyId === food.id"
        @action="buyFoodItem(food.id)"
      >
        <div
          class="flex flex-wrap gap-1.5 text-[10px] font-semibold text-muted"
        >
          <span class="rounded-full bg-[#e9efe0] px-2 py-1"
            >+{{ food.hungerRestore }} сытости</span
          >
          <span class="rounded-full bg-[#f7e7e2] px-2 py-1"
            >+{{ food.moodBonus }} настроения</span
          >
        </div>
      </ShopItem>
    </div>

    <Pager
      :page="foodPage"
      :total-pages="foodPagination?.totalPages ?? 1"
      @change="changePage"
    />
  </div>
</template>
