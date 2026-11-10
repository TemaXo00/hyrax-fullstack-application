import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import * as authApi from '../auth.api';
import { getApiErrorMessage, setAccessToken } from '../http';

import type { Me } from '../auth.api';
import type { LoginInput, RegisterInput } from '@org/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Me | null>(null);
  const initialized = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let initialization: Promise<void> | null = null;

  const isAuthenticated = computed(() => user.value !== null);
  const nickname = computed(() => user.value?.nickname ?? '');
  const coins = computed(() => Number(user.value?.stats?.coins ?? 0));

  function clearSession(): void {
    user.value = null;
    error.value = null;
    setAccessToken(null);
  }

  function clearError(): void {
    error.value = null;
  }

  async function fetchMe(): Promise<void> {
    user.value = await authApi.getMe();
  }

  async function login(input: LoginInput): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const result = await authApi.login(input);

      setAccessToken(result.accessToken);
      await fetchMe();
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
      throw requestError;
    } finally {
      loading.value = false;
    }
  }

  async function register(input: RegisterInput): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const result = await authApi.register(input);

      setAccessToken(result.accessToken);
      await fetchMe();
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError);
      throw requestError;
    } finally {
      loading.value = false;
    }
  }

  async function restore(): Promise<void> {
    try {
      const result = await authApi.refresh();

      setAccessToken(result.accessToken);
      await fetchMe();
    } catch {
      clearSession();
    }
  }

  async function ensureInitialized(): Promise<void> {
    if (initialized.value) {
      return;
    }

    if (!initialization) {
      initialization = restore().finally(() => {
        initialized.value = true;
        initialization = null;
      });
    }

    await initialization;
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }

  async function refreshProfile(): Promise<void> {
    if (!isAuthenticated.value) {
      return;
    }

    await fetchMe();
  }

  return {
    user,
    initialized,
    loading,
    error,
    isAuthenticated,
    nickname,
    coins,
    login,
    register,
    logout,
    restore,
    ensureInitialized,
    refreshProfile,
    fetchMe,
    clearSession,
    clearError,
  };
});
