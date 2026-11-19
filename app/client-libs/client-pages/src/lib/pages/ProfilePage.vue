<script setup lang="ts">
import { useAuthStore } from '@org/api-client';
import { usePetGame, useSession } from '@org/client-composables';
import { formatNumber } from '@org/client-core';
import { SpeciesSwitch } from '@org/client-pet';
import {
  AppButton,
  AppCard,
  AppIcon,
  CoinPill,
  PageTitle,
} from '@org/client-ui';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const auth = useAuthStore();
const { user } = storeToRefs(auth);
const { logout } = useSession();
const { pet, level, coins, species, speciesMeta, setSpecies, foodInventory } =
  usePetGame();

const stats = computed(() => [
  {
    label: 'Монеты',
    value: formatNumber(coins.value),
    icon: 'coin' as const,
  },
  {
    label: 'Кликов',
    value: formatNumber(user.value?.stats?.totalClicks ?? 0),
    icon: 'paw' as const,
  },
  {
    label: 'Кормлений',
    value: formatNumber(user.value?.stats?.totalFeeds ?? 0),
    icon: 'bowl' as const,
  },
  {
    label: 'Серия',
    value: `${user.value?.streak?.currentStreak ?? 0} дн.`,
    icon: 'clock' as const,
  },
  {
    label: 'Достижений',
    value: `${user.value?.achievements?.length ?? 0}`,
    icon: 'trophy' as const,
  },
  {
    label: 'Еды',
    value: `${foodInventory.value.length}`,
    icon: 'leaf' as const,
  },
]);

const nickname = computed(() => user.value?.nickname ?? 'Игрок');
</script>

<template>
  <div>
    <PageTitle title="Профиль" subtitle="Ваш аккаунт и питомец.">
      <template #aside>
        <CoinPill :value="coins" />
      </template>
    </PageTitle>

    <div
      class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start"
    >
      <div class="space-y-3">
        <AppCard>
          <div class="flex items-center gap-4">
            <div
              class="grid size-20 shrink-0 place-items-center rounded-full border border-ink/15 bg-cream"
            >
              <img
                :src="speciesMeta.image"
                :alt="speciesMeta.label"
                class="size-16 object-contain"
              />
            </div>
            <div class="min-w-0">
              <h2 class="truncate text-xl font-extrabold text-ink">
                {{ nickname }}
              </h2>
              <p class="mt-0.5 text-xs text-muted">
                {{ user?.roleLabel ?? 'Игрок' }} · {{ pet?.name ?? 'Питомец' }}
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  class="rounded-full bg-butter/50 px-2.5 py-1 text-[10px] font-bold text-ink/70"
                >
                  Уровень {{ level }}
                </span>
                <span
                  class="rounded-full bg-[#e9efe0] px-2.5 py-1 text-[10px] font-bold text-moss-dark"
                >
                  {{ speciesMeta.label }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-2">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="rounded-2xl border border-ink/10 bg-cream/60 px-2.5 py-2.5"
            >
              <AppIcon :name="stat.icon" :size="14" class="text-ink/45" />
              <p class="mt-1.5 text-sm font-extrabold leading-none text-ink">
                {{ stat.value }}
              </p>
              <p class="mt-1 text-[10px] font-medium text-muted">
                {{ stat.label }}
              </p>
            </div>
          </div>
        </AppCard>

        <AppCard tone="cream">
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Питомец
          </p>
          <p class="mt-1 text-xs leading-relaxed text-ink/65">
            {{ speciesMeta.note }}
          </p>
          <div class="mt-3">
            <SpeciesSwitch :species="species" @change="setSpecies" />
          </div>
        </AppCard>
      </div>

      <div class="space-y-3">
        <AppCard>
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Аккаунт
          </p>
          <dl class="mt-3 space-y-2.5 text-sm">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-muted">Никнейм</dt>
              <dd class="truncate font-semibold text-ink">
                {{ nickname }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-muted">Роль</dt>
              <dd class="font-semibold text-ink">
                {{ user?.roleLabel ?? 'Игрок' }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-muted">Лучшая серия</dt>
              <dd class="font-semibold text-ink">
                {{ user?.streak?.bestStreak ?? 0 }} дн.
              </dd>
            </div>
          </dl>
        </AppCard>

        <AppCard tone="lilac">
          <div class="flex items-start gap-3">
            <span
              class="grid size-9 shrink-0 place-items-center rounded-full bg-paper/70 text-ink/60"
            >
              <AppIcon name="leaf" :size="17" />
            </span>
            <div>
              <p class="text-sm font-bold text-ink">Как играть</p>
              <p class="mt-1 text-[11px] leading-relaxed text-ink/60">
                Гладьте питомца, чтобы получать монеты. Кормите его, гуляйте и
                покупайте улучшения. Настроение влияет на доход, а серия входов
                приносит ежедневные награды.
              </p>
            </div>
          </div>
        </AppCard>

        <AppButton variant="danger" block @click="logout">
          <AppIcon name="close" :size="16" />
          Выйти из аккаунта
        </AppButton>
      </div>
    </div>
  </div>
</template>
