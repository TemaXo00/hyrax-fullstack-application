<script setup lang="ts">
import { useAuthStore } from '@org/api-client';
import { onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

onMounted(() => auth.clearError());

const form = reactive({
  nickname: '',
  password: '',
  passwordConfirmation: '',
});

const validationError = ref<string | null>(null);

function validate(): string | null {
  const nickname = form.nickname.trim();

  if (nickname.length < 3) {
    return 'Никнейм должен быть не короче 3 символов';
  }

  if (nickname.length > 70) {
    return 'Никнейм должен быть не длиннее 70 символов';
  }

  if (form.password.length < 8) {
    return 'Пароль должен быть не короче 8 символов';
  }

  if (!/[a-z]/.test(form.password)) {
    return 'Пароль должен содержать строчную букву';
  }

  if (!/[A-Z]/.test(form.password)) {
    return 'Пароль должен содержать заглавную букву';
  }

  if (!/\d/.test(form.password)) {
    return 'Пароль должен содержать цифру';
  }

  if (form.password !== form.passwordConfirmation) {
    return 'Пароли не совпадают';
  }

  return null;
}

async function submit(): Promise<void> {
  validationError.value = validate();

  if (validationError.value) {
    return;
  }

  try {
    await auth.register({
      nickname: form.nickname.trim(),
      password: form.password,
      passwordConfirmation: form.passwordConfirmation,
    });

    await router.push('/');
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
        Создать аккаунт
      </h1>
      <p class="mt-2 text-sm text-slate-500">
        После регистрации у вас появится собственный питомец и стартовые монеты.
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
            autocomplete="new-password"
            class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring focus:ring-emerald-100"
            placeholder="••••••••"
          >
          <span class="mt-1 block text-xs font-normal text-slate-400">
            Минимум 8 символов, строчная и заглавная буквы, цифра.
          </span>
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Повторите пароль
          <input
            v-model="form.passwordConfirmation"
            type="password"
            autocomplete="new-password"
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
          {{ auth.loading ? 'Создаём…' : 'Зарегистрироваться' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        Уже есть аккаунт?
        <RouterLink
          to="/login"
          class="font-semibold text-emerald-700 hover:underline"
        >
          Войти
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped></style>
