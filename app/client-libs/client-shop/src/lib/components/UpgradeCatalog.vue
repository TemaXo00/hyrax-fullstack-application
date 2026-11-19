<script setup lang="ts">
import { usePetGame, useShopCatalog } from '@org/client-composables';
import { EmptyState, Pager } from '@org/client-ui';

import ShopItem from './ShopItem.vue';

const {
  upgrades,
  upgradeLoading,
  upgradePagination,
  upgradePage,
  buyUpgradeItem,
  loadUpgrades,
  busyId,
} = useShopCatalog();
const { coins } = usePetGame();

async function changePage(page: number): Promise<void> {
  upgradePage.value = page;
  await loadUpgrades();
}
</script>

<template>
  <div>
    <div
      v-if="upgradeLoading && upgrades.length === 0"
      class="grid gap-3 sm:grid-cols-2"
    >
      <div
        v-for="index in 4"
        :key="index"
        class="h-44 animate-pulse rounded-[24px] border border-ink/10 bg-paper/60"
      />
    </div>

    <EmptyState
      v-else-if="upgrades.length === 0"
      icon="star"
      title="Улучшений нет"
      description="Каталог улучшений появится здесь."
    />

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <ShopItem
        v-for="upgrade in upgrades"
        :key="upgrade.id"
        :title="upgrade.name"
        :description="upgrade.description"
        :glyph="upgrade.effectType === 'CLICK_POWER' ? '✦' : '◷'"
        :price="upgrade.isMaxLevel ? null : upgrade.nextLevelPrice"
        :badge="`${upgrade.ownedLevel}/${upgrade.maxLevel}`"
        tone="lilac"
        :action-label="
          upgrade.isMaxLevel
            ? 'Максимум'
            : coins >= upgrade.nextLevelPrice
              ? 'Улучшить'
              : 'Не хватает'
        "
        :disabled="upgrade.isMaxLevel || coins < upgrade.nextLevelPrice"
        :loading="busyId === upgrade.id"
        @action="buyUpgradeItem(upgrade.id)"
      >
        <div class="space-y-2">
          <div
            class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
          >
            <span>Уровень</span>
            <span>{{ upgrade.ownedLevel }} / {{ upgrade.maxLevel }}</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div
              class="h-full rounded-full bg-[#a99ed0]"
              :style="{
                width: `${(upgrade.ownedLevel / upgrade.maxLevel) * 100}%`,
              }"
            />
          </div>
          <p class="text-[11px] text-muted">
            {{ upgrade.effectTypeLabel }} +{{ upgrade.effectValue }} за уровень
          </p>
        </div>
      </ShopItem>
    </div>

    <Pager
      :page="upgradePage"
      :total-pages="upgradePagination?.totalPages ?? 1"
      @change="changePage"
    />
  </div>
</template>
