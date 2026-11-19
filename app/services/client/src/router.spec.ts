import { useAuthStore } from '@org/api-client';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';

import { createAppRouter } from './router';

async function prepare(authenticated: boolean) {
  const pinia = createPinia();

  setActivePinia(pinia);

  const auth = useAuthStore();

  vi.spyOn(auth, 'ensureInitialized').mockResolvedValue();

  if (authenticated) {
    auth.user = { nickname: 'Alina' } as never;
  }

  return {
    auth,
    router: createAppRouter(createMemoryHistory()),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createAppRouter', () => {
  it('registers the game routes and lazy pages', () => {
    const router = createAppRouter(createMemoryHistory());
    const names = router
      .getRoutes()
      .map((route) => route.name)
      .filter(Boolean);

    expect(names).toEqual(
      expect.arrayContaining([
        'Game',
        'Shop',
        'Achievements',
        'Leaderboard',
        'Profile',
        'Login',
        'Register',
      ]),
    );
  });

  it('redirects guests from protected pages to login', async () => {
    const { router } = await prepare(false);

    await router.push('/shop');

    expect(router.currentRoute.value.name).toBe('Login');
    expect(router.currentRoute.value.query.redirect).toBe('/shop');
  });

  it('keeps the full path in the redirect query', async () => {
    const { router } = await prepare(false);

    await router.push('/achievements?page=2');

    expect(router.currentRoute.value.name).toBe('Login');
    expect(router.currentRoute.value.query.redirect).toBe(
      '/achievements?page=2',
    );
  });

  it('allows authenticated users into protected pages', async () => {
    const { router, auth } = await prepare(true);

    await router.push('/profile');

    expect(router.currentRoute.value.name).toBe('Profile');
    expect(auth.ensureInitialized).toHaveBeenCalledTimes(1);
  });

  it('redirects authenticated users away from guest pages', async () => {
    const { router } = await prepare(true);

    await router.push('/login');

    expect(router.currentRoute.value.name).toBe('Game');
  });

  it('allows guests into the login page', async () => {
    const { router } = await prepare(false);

    await router.push('/login');

    expect(router.currentRoute.value.name).toBe('Login');
    expect(router.currentRoute.value.query.redirect).toBeUndefined();
  });

  it('redirects unknown paths to the game page', async () => {
    const { router } = await prepare(true);

    await router.push('/does-not-exist');

    expect(router.currentRoute.value.name).toBe('Game');
    expect(router.currentRoute.value.fullPath).toBe('/');
  });

  it('initializes the session before every navigation', async () => {
    const { router, auth } = await prepare(true);

    await router.push('/shop');
    await router.push('/leaderboard');

    expect(auth.ensureInitialized).toHaveBeenCalledTimes(2);
  });
});
