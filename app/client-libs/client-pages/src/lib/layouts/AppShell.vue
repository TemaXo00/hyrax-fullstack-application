<script setup lang="ts">
import { useAuthStore } from '@org/api-client';
import { usePetGame } from '@org/client-composables';
import { AppIcon, CoinPill } from '@org/client-ui';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

const auth = useAuthStore();
const { nickname } = storeToRefs(auth);
const { pet, coins, speciesMeta, loadState } = usePetGame();

const navItems = [
  { to: '/', label: 'Главная', icon: 'home' as const },
  { to: '/shop', label: 'Магазин', icon: 'bag' as const },
  { to: '/achievements', label: 'Достижения', icon: 'trophy' as const },
  { to: '/leaderboard', label: 'Рейтинг', icon: 'chart' as const },
  { to: '/profile', label: 'Профиль', icon: 'user' as const },
];

onMounted(() => {
  if (!pet.value) {
    void loadState();
  }
});
</script>

<template>
  <div class="min-h-screen">
    <header
      class="sticky top-0 z-40 border-b border-ink/10 bg-cream/85 backdrop-blur-md"
    >
      <div
        class="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6"
      >
        <RouterLink to="/" class="flex items-center gap-2">
          <span
            class="grid size-9 place-items-center rounded-full border border-ink/20 bg-paper text-ink"
          >
            <AppIcon name="paw" :size="19" />
          </span>
          <span class="text-lg font-extrabold tracking-tight text-ink"
            >Hyrax</span
          >
        </RouterLink>

        <nav class="ml-4 hidden items-center gap-1 lg:flex">
          <RouterLink
            v-for="item in navItems.slice(1, 4)"
            :key="item.to"
            :to="item.to"
            class="rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-paper hover:text-ink"
            active-class="bg-paper text-ink shadow-[0_2px_0_rgba(88,70,45,0.08)]"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <CoinPill
            :value="coins"
            size="sm"
            action
            @action="$router.push('/shop')"
          />
          <RouterLink
            to="/profile"
            class="flex items-center gap-2 rounded-full border border-ink/15 bg-paper/80 py-1 pl-1 pr-2.5 transition hover:bg-paper"
          >
            <img
              :src="speciesMeta.image"
              :alt="speciesMeta.label"
              class="size-7 rounded-full object-contain"
            />
            <span
              class="hidden max-w-24 truncate text-xs font-bold text-ink sm:block"
            >
              {{ nickname }}
            </span>
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
      <RouterView />
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div class="mx-auto grid max-w-md grid-cols-5 px-2 py-1.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold text-muted transition"
          active-class="bg-paper text-ink"
          :exact-active-class="item.to === '/' ? 'bg-paper text-ink' : ''"
        >
          <AppIcon :name="item.icon" :size="19" />
          {{ item.label }}
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
