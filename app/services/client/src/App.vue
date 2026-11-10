<script setup lang="ts">
import { formatNumber, useAuthStore, useGameStore } from '@org/api-client';
import { computed } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

const auth = useAuthStore();
const game = useGameStore();
const router = useRouter();

const coins = computed(() =>
  formatNumber(game.stats?.coins ?? auth.user?.stats?.coins ?? 0),
);

async function logout(): Promise<void> {
  await auth.logout();
  game.reset();
  await router.push({ name: 'Login' });
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-b from-slate-50 via-emerald-50/40 to-slate-100 text-slate-900">
    <header class="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <RouterLink
          to="/"
          class="flex items-center gap-2 text-lg font-black tracking-tight"
        >
          <span aria-hidden="true">🐾</span>
          <span>Hyrax</span>
        </RouterLink>

        <nav class="flex items-center gap-1 text-sm font-semibold text-slate-500">
          <RouterLink
            v-if="auth.isAuthenticated"
            to="/"
            class="rounded-full px-3 py-1.5 transition hover:bg-white hover:text-slate-900"
            active-class="bg-white text-slate-900 shadow-sm"
          >
            Игра
          </RouterLink>
          <RouterLink
            to="/about"
            class="rounded-full px-3 py-1.5 transition hover:bg-white hover:text-slate-900"
            active-class="bg-white text-slate-900 shadow-sm"
          >
            О проекте
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-2 text-sm">
          <template v-if="auth.isAuthenticated">
            <span class="hidden items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 font-bold text-amber-800 sm:flex">
              <span aria-hidden="true">🪙</span>
              {{ coins }}
            </span>
            <span class="hidden max-w-40 truncate font-semibold text-slate-700 md:inline">
              {{ auth.nickname }}
            </span>
            <button
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50"
              @click="logout()"
            >
              Выйти
            </button>
          </template>

          <template v-else>
            <RouterLink
              to="/login"
              class="rounded-full px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-white"
            >
              Войти
            </RouterLink>
            <RouterLink
              to="/register"
              class="rounded-full bg-emerald-600 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-700"
            >
              Регистрация
            </RouterLink>
          </template>
        </div>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style></style>
