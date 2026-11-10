<script setup lang="ts">
import {
  clampPercent,
  formatCoins,
  formatNumber,
  formatTimeUntil,
  moodEmoji,
  useGameStore,
} from '@org/api-client';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

const game = useGameStore();

const {
  pet,
  stats,
  loading,
  actionLoading,
  error,
  notice,
  foodInventory,
  cosmeticInventory,
  userUpgrades,
  decay,
  foods,
  foodPagination,
  foodsLoading,
  foodSearch,
  foodPage,
  cosmetics,
  cosmeticPagination,
  cosmeticsLoading,
  cosmeticSearch,
  cosmeticPage,
  upgrades,
  upgradePagination,
  upgradesLoading,
  upgradeSearch,
  upgradePage,
} = storeToRefs(game);

const activeShopTab = ref<'food' | 'cosmetics' | 'upgrades'>('food');
const shopTabs = [
  { key: 'food', label: 'Еда' },
  { key: 'cosmetics', label: 'Косметика' },
  { key: 'upgrades', label: 'Улучшения' },
] as const;
const renameOpen = ref(false);
const petName = ref('');
const selectedFoodId = ref('');

const ownedCosmeticIds = computed(
  () => new Set(cosmeticInventory.value.map((item) => item.cosmetic.id)),
);

const xpPercent = computed(() => {
  if (!pet.value || pet.value.xpToNextLevel <= 0) {
    return 0;
  }

  return clampPercent((pet.value.xp / pet.value.xpToNextLevel) * 100);
});

const busy = computed(() => actionLoading.value !== null);

const selectedFood = computed(
  () =>
    foodInventory.value.find((item) => item.food.id === selectedFoodId.value) ??
    null,
);

watch(
  foodInventory,
  (items) => {
    if (!items.some((item) => item.food.id === selectedFoodId.value)) {
      selectedFoodId.value = items[0]?.food.id ?? '';
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (!pet.value) {
    void game.loadState();
  }

  void game.loadFoods();
  void game.loadCosmetics();
  void game.loadUpgrades();
});

function openRename(): void {
  petName.value = pet.value?.name ?? '';
  renameOpen.value = true;
}

async function submitRename(): Promise<void> {
  const value = petName.value.trim();

  if (!value) {
    return;
  }

  await game.rename(value);

  if (!error.value) {
    renameOpen.value = false;
  }
}

function changePage(
  kind: 'food' | 'cosmetics' | 'upgrades',
  direction: -1 | 1,
): void {
  if (kind === 'food') {
    foodPage.value = Math.max(1, foodPage.value + direction);
    void game.loadFoods();

    return;
  }

  if (kind === 'cosmetics') {
    cosmeticPage.value = Math.max(1, cosmeticPage.value + direction);
    void game.loadCosmetics();

    return;
  }

  upgradePage.value = Math.max(1, upgradePage.value + direction);
  void game.loadUpgrades();
}

function rarityClass(rarity: string): string {
  if (rarity === 'EPIC') {
    return 'bg-fuchsia-100 text-fuchsia-700';
  }

  if (rarity === 'RARE') {
    return 'bg-sky-100 text-sky-700';
  }

  return 'bg-slate-100 text-slate-600';
}
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
    <div
      v-if="error"
      class="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      <span>{{ error }}</span>
      <button
        type="button"
        class="shrink-0 font-semibold hover:text-rose-900"
        @click="game.clearMessages()"
      >
        Закрыть
      </button>
    </div>

    <div
      v-if="notice"
      class="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
    >
      <span>{{ notice }}</span>
      <button
        type="button"
        class="shrink-0 font-semibold hover:text-emerald-900"
        @click="game.clearMessages()"
      >
        Закрыть
      </button>
    </div>

    <div
      v-if="loading && !pet"
      class="grid gap-6 lg:grid-cols-3"
      aria-label="Загрузка питомца"
    >
      <div class="h-72 animate-pulse rounded-3xl bg-white/70 lg:col-span-2" />
      <div class="h-72 animate-pulse rounded-3xl bg-white/70" />
    </div>

    <template v-else-if="pet">
      <section class="grid gap-6 lg:grid-cols-3">
        <article
          class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm shadow-slate-200/60 lg:col-span-2"
        >
          <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div
              class="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-linear-to-br from-amber-100 via-orange-100 to-rose-100 text-6xl"
              aria-hidden="true"
            >
              {{ moodEmoji(pet.mood) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <template v-if="!renameOpen">
                  <h1 class="truncate text-2xl font-bold text-slate-900">
                    {{ pet.name }}
                  </h1>
                  <button
                    type="button"
                    class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    @click="openRename()"
                  >
                    Переименовать
                  </button>
                </template>

                <form
                  v-else
                  class="flex w-full flex-wrap items-center gap-2"
                  @submit.prevent="submitRename()"
                >
                  <input
                    v-model="petName"
                    maxlength="70"
                    class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:border-emerald-300 focus:ring"
                    placeholder="Имя питомца"
                    autofocus
                  >
                  <button
                    type="submit"
                    class="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    :disabled="busy"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                    @click="renameOpen = false"
                  >
                    Отмена
                  </button>
                </form>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span class="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  Уровень {{ pet.level }}
                </span>
                <span>{{ pet.moodStatusLabel }}</span>
              </div>

              <div class="mt-5 space-y-4">
                <div>
                  <div class="mb-1 flex justify-between text-xs font-medium text-slate-500">
                    <span>Опыт</span>
                    <span>{{ formatNumber(pet.xp) }} / {{ formatNumber(pet.xpToNextLevel) }}</span>
                  </div>
                  <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-indigo-500 transition-all"
                      :style="{ width: `${xpPercent}%` }"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-1 flex justify-between text-xs font-medium text-slate-500">
                    <span>Настроение</span>
                    <span>{{ pet.mood }} / 100</span>
                  </div>
                  <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="
                        pet.mood >= 70
                          ? 'bg-emerald-500'
                          : pet.mood >= 30
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      "
                      :style="{ width: `${clampPercent(pet.mood)}%` }"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-1 flex justify-between text-xs font-medium text-slate-500">
                    <span>Голод</span>
                    <span>{{ pet.hunger }} / 100</span>
                  </div>
                  <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="
                        pet.hunger >= 60
                          ? 'bg-emerald-500'
                          : pet.hunger >= 30
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      "
                      :style="{ width: `${clampPercent(pet.hunger)}%` }"
                    />
                  </div>
                </div>
              </div>

              <p
                v-if="decay"
                class="mt-4 text-xs text-slate-400"
              >
                Настроение обнулится через {{ formatTimeUntil(decay.moodZeroAt) }},
                голод — через {{ formatTimeUntil(decay.hungerZeroAt) }}.
              </p>
            </div>
          </div>
        </article>

        <aside class="space-y-4">
          <div class="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Статистика
            </h2>
            <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-2xl bg-slate-50 p-3">
                <dt class="text-xs text-slate-400">
                  Монеты
                </dt>
                <dd class="mt-1 text-lg font-bold text-slate-900">
                  {{ stats ? formatNumber(stats.coins) : '0' }}
                </dd>
              </div>
              <div class="rounded-2xl bg-slate-50 p-3">
                <dt class="text-xs text-slate-400">
                  Сила клика
                </dt>
                <dd class="mt-1 text-lg font-bold text-slate-900">
                  {{ stats?.clickPower ?? 0 }}
                </dd>
              </div>
              <div class="rounded-2xl bg-slate-50 p-3">
                <dt class="text-xs text-slate-400">
                  В минуту
                </dt>
                <dd class="mt-1 text-lg font-bold text-slate-900">
                  {{ stats?.autoIncome ?? 0 }}
                </dd>
              </div>
              <div class="rounded-2xl bg-slate-50 p-3">
                <dt class="text-xs text-slate-400">
                  Кликов
                </dt>
                <dd class="mt-1 text-lg font-bold text-slate-900">
                  {{ stats ? formatNumber(stats.totalClicks) : '0' }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Действия
            </h2>
            <div class="mt-4 grid gap-2">
              <button
                type="button"
                class="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="busy"
                @click="game.click()"
              >
                {{ actionLoading === 'click' ? 'Кликаем…' : 'Погладить (+ монеты)' }}
              </button>
              <button
                type="button"
                class="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="busy"
                @click="game.walk()"
              >
                {{ actionLoading === 'walk' ? 'Гуляем…' : 'Выгулять (x5 награда)' }}
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section class="mt-6 grid gap-6 lg:grid-cols-3">
        <article class="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Кормление
          </h2>

          <div
            v-if="foodInventory.length === 0"
            class="mt-4 text-sm text-slate-500"
          >
            Инвентарь пуст. Купите еду во вкладке «Еда».
          </div>

          <div
            v-else
            class="mt-4 space-y-3"
          >
            <label class="block text-xs font-medium text-slate-500">
              Что дать питомцу
              <select
                v-model="selectedFoodId"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-300"
              >
                <option
                  v-for="item in foodInventory"
                  :key="item.id"
                  :value="item.food.id"
                >
                  {{ item.food.name }} ({{ item.quantity }} шт., +{{ item.food.hungerRestore }} голода)
                </option>
              </select>
            </label>

            <p
              v-if="selectedFood"
              class="text-xs text-slate-400"
            >
              Восстановит {{ selectedFood.food.hungerRestore }} голода и
              +{{ selectedFood.food.moodBonus }} настроения.
            </p>

            <button
              type="button"
              class="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-200 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="busy || !selectedFoodId"
              @click="game.feed(selectedFoodId)"
            >
              {{ actionLoading === 'feed' ? 'Кормим…' : 'Покормить' }}
            </button>
          </div>
        </article>

        <article class="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Косметика
          </h2>

          <div
            v-if="cosmeticInventory.length === 0"
            class="mt-4 text-sm text-slate-500"
          >
            Пока ничего не куплено.
          </div>

          <ul
            v-else
            class="mt-4 space-y-2"
          >
            <li
              v-for="item in cosmeticInventory"
              :key="item.id"
              class="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm"
            >
              <div class="min-w-0">
                <p class="truncate font-semibold text-slate-800">
                  {{ item.cosmetic.name }}
                </p>
                <p class="text-xs text-slate-400">
                  {{ item.cosmetic.slotLabel }}
                </p>
              </div>

              <button
                type="button"
                class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60"
                :class="
                  item.isEquipped
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'border border-slate-200 text-slate-600 hover:bg-white'
                "
                :disabled="busy"
                @click="game.equipCosmeticItem(item.cosmetic.id, !item.isEquipped)"
              >
                {{ item.isEquipped ? 'Снять' : 'Надеть' }}
              </button>
            </li>
          </ul>
        </article>

        <article class="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Мои улучшения
          </h2>

          <div
            v-if="userUpgrades.length === 0"
            class="mt-4 text-sm text-slate-500"
          >
            Улучшений пока нет.
          </div>

          <ul
            v-else
            class="mt-4 space-y-2"
          >
            <li
              v-for="item in userUpgrades"
              :key="item.id"
              class="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm"
            >
              <div class="min-w-0">
                <p class="truncate font-semibold text-slate-800">
                  {{ item.upgrade.name }}
                </p>
                <p class="text-xs text-slate-400">
                  {{ item.upgrade.effectTypeLabel }} +{{ item.upgrade.effectValue }}
                </p>
              </div>
              <span class="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                ур. {{ item.level }}
              </span>
            </li>
          </ul>
        </article>
      </section>

      <section class="mt-8 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <h2 class="text-lg font-bold text-slate-900">
            Магазин
          </h2>

          <div class="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
            <button
              v-for="tab in shopTabs"
              :key="tab.key"
              type="button"
              class="rounded-full px-4 py-2 transition"
              :class="
                activeShopTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              "
              @click="activeShopTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div
          v-if="activeShopTab === 'food'"
          class="mt-5"
        >
          <form
            class="flex flex-wrap gap-2"
            @submit.prevent="game.searchFoods()"
          >
            <input
              v-model="foodSearch"
              class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
              placeholder="Поиск еды (минимум 3 символа)"
            >
            <button
              type="submit"
              class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Найти
            </button>
          </form>

          <div
            v-if="foodsLoading"
            class="mt-6 text-sm text-slate-500"
          >
            Загружаем каталог…
          </div>

          <div
            v-else
            class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <article
              v-for="food in foods"
              :key="food.id"
              class="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div
                class="text-3xl"
                aria-hidden="true"
              >
                🍽️
              </div>
              <h3 class="mt-2 font-semibold text-slate-900">
                {{ food.name }}
              </h3>
              <p class="mt-1 line-clamp-2 flex-1 text-xs text-slate-500">
                {{ food.description }}
              </p>
              <p class="mt-2 text-xs text-slate-400">
                +{{ food.hungerRestore }} голода, +{{ food.moodBonus }} настроения
              </p>
              <div class="mt-3 flex items-center justify-between gap-2">
                <span class="text-sm font-bold text-slate-900">{{ formatCoins(food.price) }}</span>
                <button
                  type="button"
                  class="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  :disabled="busy"
                  @click="game.buyFoodItem(food.id)"
                >
                  Купить
                </button>
              </div>
            </article>
          </div>

          <div
            v-if="foodPagination"
            class="mt-4 flex items-center justify-between text-sm text-slate-500"
          >
            <span>Страница {{ foodPagination.page }} из {{ foodPagination.totalPages }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                :disabled="!foodPagination.hasPrev"
                @click="changePage('food', -1)"
              >
                Назад
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                :disabled="!foodPagination.hasNext"
                @click="changePage('food', 1)"
              >
                Вперёд
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="activeShopTab === 'cosmetics'"
          class="mt-5"
        >
          <form
            class="flex flex-wrap gap-2"
            @submit.prevent="game.searchCosmetics()"
          >
            <input
              v-model="cosmeticSearch"
              class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
              placeholder="Поиск косметики (минимум 3 символа)"
            >
            <button
              type="submit"
              class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Найти
            </button>
          </form>

          <div
            v-if="cosmeticsLoading"
            class="mt-6 text-sm text-slate-500"
          >
            Загружаем каталог…
          </div>

          <div
            v-else
            class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <article
              v-for="cosmetic in cosmetics"
              :key="cosmetic.id"
              class="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-2">
                <div
                  class="text-3xl"
                  aria-hidden="true"
                >
                  🎩
                </div>
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="rarityClass(cosmetic.rarity)"
                >
                  {{ cosmetic.rarityLabel }}
                </span>
              </div>
              <h3 class="mt-2 font-semibold text-slate-900">
                {{ cosmetic.name }}
              </h3>
              <p class="mt-1 line-clamp-2 flex-1 text-xs text-slate-500">
                {{ cosmetic.description }}
              </p>
              <p class="mt-2 text-xs text-slate-400">
                {{ cosmetic.slotLabel }}
              </p>
              <div class="mt-3 flex items-center justify-between gap-2">
                <span class="text-sm font-bold text-slate-900">{{ formatCoins(cosmetic.price) }}</span>
                <button
                  type="button"
                  class="rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60"
                  :class="
                    ownedCosmeticIds.has(cosmetic.id)
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  "
                  :disabled="busy || ownedCosmeticIds.has(cosmetic.id)"
                  @click="game.buyCosmeticItem(cosmetic.id)"
                >
                  {{ ownedCosmeticIds.has(cosmetic.id) ? 'Куплено' : 'Купить' }}
                </button>
              </div>
            </article>
          </div>

          <div
            v-if="cosmeticPagination"
            class="mt-4 flex items-center justify-between text-sm text-slate-500"
          >
            <span>Страница {{ cosmeticPagination.page }} из {{ cosmeticPagination.totalPages }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                :disabled="!cosmeticPagination.hasPrev"
                @click="changePage('cosmetics', -1)"
              >
                Назад
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                :disabled="!cosmeticPagination.hasNext"
                @click="changePage('cosmetics', 1)"
              >
                Вперёд
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="activeShopTab === 'upgrades'"
          class="mt-5"
        >
          <form
            class="flex flex-wrap gap-2"
            @submit.prevent="game.searchUpgrades()"
          >
            <input
              v-model="upgradeSearch"
              class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300"
              placeholder="Поиск улучшений (минимум 3 символа)"
            >
            <button
              type="submit"
              class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Найти
            </button>
          </form>

          <div
            v-if="upgradesLoading"
            class="mt-6 text-sm text-slate-500"
          >
            Загружаем каталог…
          </div>

          <div
            v-else
            class="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <article
              v-for="upgrade in upgrades"
              :key="upgrade.id"
              class="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-slate-900">
                    {{ upgrade.name }}
                  </h3>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ upgrade.description }}
                  </p>
                </div>
                <span class="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                  ур. {{ upgrade.ownedLevel }} / {{ upgrade.maxLevel }}
                </span>
              </div>

              <p class="mt-2 text-xs text-slate-400">
                {{ upgrade.effectTypeLabel }} +{{ upgrade.effectValue }} за уровень
              </p>

              <div class="mt-3 flex items-center justify-between gap-2">
                <span class="text-sm font-bold text-slate-900">
                  {{ upgrade.isMaxLevel ? 'Максимальный уровень' : formatCoins(upgrade.nextLevelPrice) }}
                </span>
                <button
                  type="button"
                  class="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  :disabled="busy || upgrade.isMaxLevel"
                  @click="game.buyUpgradeItem(upgrade.id)"
                >
                  Улучшить
                </button>
              </div>
            </article>
          </div>

          <div
            v-if="upgradePagination"
            class="mt-4 flex items-center justify-between text-sm text-slate-500"
          >
            <span>Страница {{ upgradePagination.page }} из {{ upgradePagination.totalPages }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                :disabled="!upgradePagination.hasPrev"
                @click="changePage('upgrades', -1)"
              >
                Назад
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                :disabled="!upgradePagination.hasNext"
                @click="changePage('upgrades', 1)"
              >
                Вперёд
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <div
      v-else
      class="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500"
    >
      Не удалось загрузить питомца.
      <button
        type="button"
        class="ml-2 font-semibold text-emerald-700 underline"
        @click="game.loadState()"
      >
        Попробовать ещё раз
      </button>
    </div>
  </div>
</template>

<style scoped></style>
