<script setup lang="ts">
import { RouterLink } from 'vue-router';

const stack = [
  { name: 'NestJS', description: 'REST API, JWT-авторизация, Socket.IO и Swagger' },
  { name: 'Vue 3', description: 'SPA-клиент на Composition API и Vue Router' },
  { name: 'Pinia', description: 'Хранение профиля, состояния питомца и каталогов' },
  { name: 'PostgreSQL', description: 'База данных под управлением Prisma ORM' },
  { name: 'Redis', description: 'Кэширование профиля и игровых данных' },
  { name: 'Docker', description: 'Запуск инфраструктуры и приложений в контейнерах' },
];

const endpoints = [
  { method: 'POST', path: '/api/auth/register', description: 'Регистрация и вход' },
  { method: 'POST', path: '/api/auth/login', description: 'Авторизация по нику и паролю' },
  { method: 'POST', path: '/api/auth/refresh', description: 'Обновление access-токена из cookie' },
  { method: 'GET', path: '/api/pets/me', description: 'Питомец, статистика и инвентарь' },
  { method: 'POST', path: '/api/pets/click', description: 'Клик по питомцу' },
  { method: 'POST', path: '/api/pets/walk', description: 'Выгул с повышенной наградой' },
  { method: 'POST', path: '/api/pets/feed', description: 'Кормление из инвентаря' },
  { method: 'QUERY', path: '/api/shop/foods', description: 'Каталог еды' },
  { method: 'QUERY', path: '/api/shop/cosmetics', description: 'Каталог косметики' },
  { method: 'QUERY', path: '/api/shop/upgrades', description: 'Каталог улучшений' },
];
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <section
      class="overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-8 shadow-sm shadow-slate-200/60 sm:p-10"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
        Современные технологии серверной разработки
      </p>
      <h1 class="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Hyrax</h1>
      <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600">
        Hyrax — учебный fullstack-проект: игра-кликер с питомцем. Игрок гладит
        питомца, выгуливает и кормит его, зарабатывает монеты, покупает еду,
        косметику и улучшения. Сервер хранит прогресс в PostgreSQL, а клиент
        получает его по REST API и обновляет в реальном времени.
      </p>

      <div class="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <RouterLink
          to="/"
          class="rounded-full bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
        >
          Перейти в игру
        </RouterLink>
        <a
          href="http://localhost:3000/api/docs"
          target="_blank"
          rel="noreferrer"
          class="rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
        >
          Swagger API
        </a>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-xl font-bold text-slate-900">Технологии</h2>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="item in stack"
          :key="item.name"
          class="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-slate-200/60"
        >
          <h3 class="font-semibold text-slate-900">{{ item.name }}</h3>
          <p class="mt-1 text-sm text-slate-500">{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section class="mt-8 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm shadow-slate-200/60 sm:p-8">
      <h2 class="text-xl font-bold text-slate-900">Основные запросы</h2>
      <p class="mt-2 text-sm text-slate-500">
        Все маршруты, кроме регистрации, входа и обновления токена, требуют
        заголовок <code class="rounded bg-slate-100 px-1.5 py-0.5">Authorization: Bearer &lt;access-token&gt;</code>.
      </p>

      <ul class="mt-4 divide-y divide-slate-100">
        <li
          v-for="endpoint in endpoints"
          :key="`${endpoint.method} ${endpoint.path}`"
          class="flex flex-wrap items-center gap-3 py-2.5 text-sm"
        >
          <span
            class="w-16 rounded-md px-2 py-1 text-center text-xs font-bold"
            :class="
              endpoint.method === 'GET'
                ? 'bg-sky-100 text-sky-700'
                : endpoint.method === 'QUERY'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-emerald-100 text-emerald-700'
            "
          >
            {{ endpoint.method }}
          </span>
          <code class="font-mono text-slate-800">{{ endpoint.path }}</code>
          <span class="ml-auto text-slate-400">{{ endpoint.description }}</span>
        </li>
      </ul>
    </section>

    <section class="mt-8 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm shadow-slate-200/60 sm:p-8">
      <h2 class="text-xl font-bold text-slate-900">Авторизация</h2>
      <p class="mt-3 text-sm leading-6 text-slate-600">
        Access-токен хранится только в памяти клиента, а refresh-токен — в
        httpOnly cookie. При перезагрузке страница автоматически
        восстанавливает сессию через <code class="rounded bg-slate-100 px-1.5 py-0.5">POST /api/auth/refresh</code>,
        поэтому повторный вход не требуется, пока cookie действительна.
      </p>
    </section>
  </div>
</template>

<style scoped></style>
