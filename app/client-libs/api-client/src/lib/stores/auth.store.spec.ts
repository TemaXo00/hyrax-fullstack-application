import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMe, login, logout, register } from '../auth.api';
import { restoreAccessToken, setAccessToken } from '../http';
import { useAuthStore } from './auth.store';

vi.mock('../auth.api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock('../http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../http')>();

  return {
    ...actual,
    restoreAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
  };
});

const mockedLogin = vi.mocked(login);
const mockedRegister = vi.mocked(register);
const mockedLogout = vi.mocked(logout);
const mockedMe = vi.mocked(getMe);
const mockedRestore = vi.mocked(restoreAccessToken);

const me = {
  id: 'user-1',
  nickname: 'Alina',
  role: 'PLAYER',
  roleLabel: 'Игрок',
  isBlocked: false,
  stats: { coins: '42' },
} as never;

const authResult = {
  accessToken: 'access',
  user: me,
} as never;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('login and register', () => {
  it('stores the token and loads the profile', async () => {
    mockedLogin.mockResolvedValue(authResult);
    mockedMe.mockResolvedValue(me);

    const store = useAuthStore();

    await store.login({ nickname: 'Alina', password: 'Password1' });

    expect(setAccessToken).toHaveBeenCalledWith('access');
    expect(store.isAuthenticated).toBe(true);
    expect(store.nickname).toBe('Alina');
    expect(store.coins).toBe(42);
    expect(store.loading).toBe(false);
  });

  it('stores a login error and rethrows it', async () => {
    mockedLogin.mockRejectedValue(new Error('bad credentials'));

    const store = useAuthStore();

    await expect(
      store.login({ nickname: 'Alina', password: 'wrong' }),
    ).rejects.toThrow('bad credentials');
    expect(store.error).toBe('bad credentials');
    expect(store.loading).toBe(false);
  });

  it('registers a new account', async () => {
    mockedRegister.mockResolvedValue(authResult);
    mockedMe.mockResolvedValue(me);

    const store = useAuthStore();

    await store.register({
      nickname: 'Alina',
      password: 'Password1',
      passwordConfirmation: 'Password1',
    });

    expect(store.isAuthenticated).toBe(true);
  });
});

describe('session restore', () => {
  it('clears the session when there is no refresh cookie', async () => {
    mockedRestore.mockResolvedValue(null);

    const store = useAuthStore();

    await store.restore();

    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('loads the profile when a token is restored', async () => {
    mockedRestore.mockResolvedValue('token');
    mockedMe.mockResolvedValue(me);

    const store = useAuthStore();

    await store.restore();

    expect(store.nickname).toBe('Alina');
  });

  it('clears the session when the profile request fails', async () => {
    mockedRestore.mockResolvedValue('token');
    mockedMe.mockRejectedValue(new Error('expired'));

    const store = useAuthStore();

    await store.restore();

    expect(store.user).toBeNull();
  });

  it('initializes only once', async () => {
    mockedRestore.mockResolvedValue(null);

    const store = useAuthStore();

    await Promise.all([store.ensureInitialized(), store.ensureInitialized()]);

    expect(mockedRestore).toHaveBeenCalledTimes(1);
    expect(store.initialized).toBe(true);
  });
});

describe('logout and helpers', () => {
  it('clears the session even when the API call fails', async () => {
    mockedLogout.mockRejectedValue(new Error('offline'));

    const store = useAuthStore();

    store.user = me;

    await expect(store.logout()).rejects.toThrow('offline');
    expect(store.user).toBeNull();
  });

  it('refreshes the profile only for authenticated users', async () => {
    mockedMe.mockResolvedValue(me);

    const store = useAuthStore();

    await store.refreshProfile();
    expect(mockedMe).not.toHaveBeenCalled();

    store.user = me;
    await store.refreshProfile();
    expect(mockedMe).toHaveBeenCalled();
  });

  it('exposes admin flag and clears errors', () => {
    const store = useAuthStore();

    store.user = { role: 'ADMIN' } as never;
    store.error = 'oops';
    store.clearError();

    expect(store.isAdmin).toBe(true);
    expect(store.error).toBeNull();

    store.clearSession();

    expect(store.user).toBeNull();
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });
});
