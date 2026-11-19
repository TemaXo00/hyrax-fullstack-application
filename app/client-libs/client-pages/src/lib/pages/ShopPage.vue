<script setup lang="ts">
import { usePetGame, useShopCatalog } from '@org/client-composables';
import { CosmeticCatalog, FoodCatalog, UpgradeCatalog } from '@org/client-shop';
import { AppCard, CoinPill, PageTitle, SegmentedControl } from '@org/client-ui';
import { onMounted, ref } from 'vue';

type ShopTab = 'food' | 'upgrades' | 'cosmetics';

const { coins, loadState } = usePetGame();
const { loadAll } = useShopCatalog();
const tab = ref<ShopTab>('food');

const tabs: Array<{ value: ShopTab; label: string }> = [
  { value: 'food', label: 'Еда' },
  { value: 'upgrades', label: 'Улучшения' },
  { value: 'cosmetics', label: 'Косметика' },
];

onMounted(() => {
  void loadAll();

  if (coins.value === 0) {
    void loadState({ silent: true });
  }
});
</script>

<template>
  <div>
    <PageTitle
      title="Магазин"
      subtitle="Еда, улучшения и вещи для комнаты питомца."
    >
      <template #aside>
        <CoinPill :value="coins" />
      </template>
    </PageTitle>

    <AppCard tone="cream" class="mb-4" :padded="false">
      <div class="flex flex-wrap items-center justify-between gap-3 p-3">
        <SegmentedControl v-model="tab" :options="tabs" />
        <p class="px-2 text-[11px] font-medium text-muted">
          Покупки списывают монеты с баланса
        </p>
      </div>
    </AppCard>

    <FoodCatalog v-if="tab === 'food'" />
    <UpgradeCatalog v-else-if="tab === 'upgrades'" />
    <CosmeticCatalog v-else />
  </div>
</template>
