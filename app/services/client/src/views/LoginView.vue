<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@org/api-client';
import AppButton from '../components/ui/AppButton.vue';
import AuthLayout from '../layouts/AuthLayout.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ nickname: '', password: '' });
const validationError = ref<string | null>(null);

const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/',
);

onMounted(() => auth.clearError());

async function submit(): Promise<void> {
  validationError.value = null;

  if (form.nickname.trim().length < 3) {
    validationError.value = 'Никнейм должен быть не короче 3 символов.';
    return;
  }

  if (!form.password) {
    validationError.value = 'Введите пароль.';
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
  <AuthLayout
    title="С возвращением"
    subtitle="Войдите, чтобы проведать питомца."
  >
    <form
      class="space-y-4"
      @submit.prevent="submit"
    >
      <label class="block">
        <span class="field-label">Никнейм</span>
        <input
          v-model="form.nickname"
          type="text"
          autocomplete="username"
          maxlength="70"
          class="field-input mt-1.5"
          placeholder="joe_doe"
        >
      </label>

      <label class="block">
        <span class="field-label">Пароль</span>
        <input
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          class="field-input mt-1.5"
          placeholder="••••••••"
        >
      </label>

      <p
        v-if="validationError || auth.error"
        class="rounded-2xl border border-clay/30 bg-[#f9e4df] px-3.5 py-2.5 text-xs font-medium text-[#7a3d31]"
      >
        {{ validationError || auth.error }}
      </p>

      <AppButton
        type="submit"
        block
        size="lg"
        :loading="auth.loading"
      >
        Войти
      </AppButton>
    </form>

    <p class="mt-5 text-center text-xs text-muted">
      Нет аккаунта?
      <RouterLink
        to="/register"
        class="font-bold text-moss-dark hover:underline"
      >
        Зарегистрироваться
      </RouterLink>
    </p>
  </AuthLayout>
</template>
