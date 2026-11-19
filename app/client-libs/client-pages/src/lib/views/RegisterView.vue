<script setup lang="ts">
import { useAuthStore } from '@org/api-client';
import { AppButton } from '@org/client-ui';
import { onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import AuthLayout from '../layouts/AuthLayout.vue';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  nickname: '',
  password: '',
  passwordConfirmation: '',
});
const validationError = ref<string | null>(null);

onMounted(() => auth.clearError());

function validate(): string | null {
  const nickname = form.nickname.trim();

  if (nickname.length < 3) {
    return 'Никнейм должен быть не короче 3 символов.';
  }

  if (nickname.length > 70) {
    return 'Никнейм должен быть не длиннее 70 символов.';
  }

  if (form.password.length < 8) {
    return 'Пароль должен быть не короче 8 символов.';
  }

  if (!/[a-z]/.test(form.password)) {
    return 'Пароль должен содержать строчную букву.';
  }

  if (!/[A-Z]/.test(form.password)) {
    return 'Пароль должен содержать заглавную букву.';
  }

  if (!/\d/.test(form.password)) {
    return 'Пароль должен содержать цифру.';
  }

  if (form.password !== form.passwordConfirmation) {
    return 'Пароли не совпадают.';
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
  <AuthLayout
    title="Новый питомец"
    subtitle="Создайте аккаунт — и познакомьтесь с даманом."
  >
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="field-label">Никнейм</span>
        <input
          v-model="form.nickname"
          type="text"
          autocomplete="username"
          maxlength="70"
          class="field-input mt-1.5"
          placeholder="joe_doe"
        />
      </label>

      <label class="block">
        <span class="field-label">Пароль</span>
        <input
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          class="field-input mt-1.5"
          placeholder="••••••••"
        />
        <span class="mt-1.5 block text-[11px] leading-relaxed text-muted">
          Минимум 8 символов, строчная и заглавная буквы, цифра.
        </span>
      </label>

      <label class="block">
        <span class="field-label">Повторите пароль</span>
        <input
          v-model="form.passwordConfirmation"
          type="password"
          autocomplete="new-password"
          class="field-input mt-1.5"
          placeholder="••••••••"
        />
      </label>

      <p
        v-if="validationError || auth.error"
        class="rounded-2xl border border-clay/30 bg-[#f9e4df] px-3.5 py-2.5 text-xs font-medium text-[#7a3d31]"
      >
        {{ validationError || auth.error }}
      </p>

      <AppButton type="submit" block size="lg" :loading="auth.loading">
        Создать аккаунт
      </AppButton>
    </form>

    <p class="mt-5 text-center text-xs text-muted">
      Уже есть аккаунт?
      <RouterLink to="/login" class="font-bold text-moss-dark hover:underline">
        Войти
      </RouterLink>
    </p>
  </AuthLayout>
</template>
