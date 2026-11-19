<script setup lang="ts">
import { formatNumber } from '@org/client-core';
import { AppIcon, EmptyState, Pager } from '@org/client-ui';

import type {
  PaginatedLeaderboard,
  LeaderboardPosition,
} from '@org/api-client';

defineProps<{
  board: PaginatedLeaderboard | null;
  myPosition: LeaderboardPosition | null;
  currentNickname: string;
  loading: boolean;
}>();

defineEmits<{ change: [page: number] }>();

function rankTone(rank: number): string {
  if (rank === 1) {
    return 'bg-butter text-ink';
  }

  if (rank === 2) {
    return 'bg-[#d9d6cf] text-ink';
  }

  if (rank === 3) {
    return 'bg-[#e2c1a5] text-ink';
  }

  return 'bg-cream text-muted';
}
</script>

<template>
  <div>
    <div
      v-if="myPosition"
      class="mb-4 flex items-center gap-3 rounded-[22px] border border-moss/35 bg-[#eef2e6] px-4 py-3"
    >
      <span
        class="grid size-9 place-items-center rounded-full bg-moss text-sm font-bold text-white"
      >
        {{ myPosition.isRanked ? `#${myPosition.rank}` : '—' }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold text-ink">Ваша позиция</p>
        <p class="text-[11px] text-muted">
          {{ myPosition.metricLabel }}
        </p>
      </div>
      <span class="text-sm font-extrabold text-ink">{{
        formatNumber(myPosition.value)
      }}</span>
    </div>

    <div v-if="loading && !board" class="space-y-2">
      <div
        v-for="index in 6"
        :key="index"
        class="h-14 animate-pulse rounded-2xl border border-ink/10 bg-paper/60"
      />
    </div>

    <EmptyState
      v-else-if="!board || board.entries.length === 0"
      icon="trophy"
      title="Рейтинг пока пуст"
      description="Сделайте несколько кликов, чтобы появиться в списке."
    />

    <template v-else>
      <div
        class="overflow-hidden rounded-[24px] border border-ink/15 bg-paper/85"
      >
        <div
          v-for="entry in board.entries"
          :key="entry.userId"
          :class="[
            'flex items-center gap-3 border-b border-ink/10 px-4 py-3 last:border-b-0',
            entry.nickname === currentNickname ? 'bg-[#f1f4ea]' : '',
          ]"
        >
          <span
            :class="[
              'grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold',
              rankTone(entry.rank),
            ]"
          >
            {{ entry.rank }}
          </span>
          <span
            class="grid size-8 place-items-center rounded-full bg-cream text-ink/50"
          >
            <AppIcon name="paw" :size="15" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-ink">
              {{ entry.nickname }}
            </p>
            <p class="truncate text-[11px] text-muted">
              {{ entry.petName ?? 'Без питомца' }}
              <template v-if="entry.petLevel">
                · ур. {{ entry.petLevel }}
              </template>
            </p>
          </div>
          <span class="shrink-0 text-sm font-extrabold text-ink">{{
            formatNumber(entry.value)
          }}</span>
        </div>
      </div>

      <Pager
        :page="board.pagination.page"
        :total-pages="board.pagination.totalPages"
        @change="$emit('change', $event)"
      />
    </template>
  </div>
</template>
