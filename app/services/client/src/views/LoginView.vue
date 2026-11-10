<script setup lang="ts">
import { useAuthStore } from '@org/api-client';
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

onMounted(() => auth.clearError());

const form = reactive({
  nickname: '',
  password: '',
});

const validationError = ref<string | null>(null);

const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/',
);

async function submit(): Promise<void> {
  validationError.value = null;

  if (form.nickname.trim().length < 3) {
    validationError.value = 'Никнейм должен быть не короче 3 символов';

    return;
  }

  if (!form.password) {
    validationError.value = 'Введите пароль';

    return;
  }

  try {
    await auth.login({
      nickname: form.nickname.trim(),
      password: form.password,
    });

    await router.push(redirectTarget.value);
  } catch {
    // Текст ошибки уже сохранён в auth.error.
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col px-4 py-12">
    <div class="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm shadow-slate-200/70 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
        Hyrax
      </p>
      <h1 class="mt-2 text-2xl font-bold text-slate-900">
        Вход в игру
      </h1>
      <p class="mt-2 text-sm text-slate-500">
        Введите никнейм и пароль, чтобы вернуться к питомцу.
      </p>

      <form
        class="mt-6 space-y-4"
        @submit.prevent="submit()"
      >
        <label class="block text-sm font-medium text-slate-700">
          Никнейм
          <input
            v-model="form.nickname"
            type="text"
            autocomplete="username"
            maxlength="70"
            class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring focus:ring-emerald-100"
            placeholder="joe_doe"
          >
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Пароль
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring focus:ring-emerald-100"
            placeholder="••••••••"
          >
        </label>

        <p
          v-if="validationError || auth.error"
          class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {{ validationError || auth.error }}
        </p>

        <button
          type="submit"
          class="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="auth.loading"
        >
          {{ auth.loading ? 'Входим…' : 'Войти' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        Нет аккаунта?
        <RouterLink
          to="/register"
          class="font-semibold text-emerald-700 hover:underline"
        >
          Зарегистрироваться
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped></style>
