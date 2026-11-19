import { useAuthStore } from '@org/api-client';
import { RouterLinkStub, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginView from './LoginView.vue';
import RegisterView from './RegisterView.vue';

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  route: { query: {} as Record<string, unknown> },
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();

  return {
    ...actual,
    useRouter: () => ({ push: routerMocks.push }),
    useRoute: () => routerMocks.route,
  };
});

const mountOptions = {
  global: { stubs: { RouterLink: RouterLinkStub } },
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  routerMocks.push.mockResolvedValue(undefined);
  routerMocks.route.query = {};
});

describe('LoginView', () => {
  async function fill(
    wrapper: ReturnType<typeof mount>,
    nickname: string,
    password: string,
  ) {
    const inputs = wrapper.findAll('input');

    await inputs[0]?.setValue(nickname);
    await inputs[1]?.setValue(password);
  }

  it('validates the nickname and password', async () => {
    const auth = useAuthStore();
    const login = vi.spyOn(auth, 'login').mockResolvedValue();
    const wrapper = mount(LoginView, mountOptions);

    await wrapper.get('form').trigger('submit');
    expect(wrapper.text()).toContain(
      'Никнейм должен быть не короче 3 символов.',
    );

    await fill(wrapper, 'player', '');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.text()).toContain('Введите пароль.');

    expect(login).not.toHaveBeenCalled();
  });

  it('logs in and redirects to the default page', async () => {
    const auth = useAuthStore();
    const login = vi.spyOn(auth, 'login').mockResolvedValue();
    const wrapper = mount(LoginView, mountOptions);

    await fill(wrapper, '  player  ', 'Password1');
    await wrapper.get('form').trigger('submit');

    expect(login).toHaveBeenCalledWith({
      nickname: 'player',
      password: 'Password1',
    });
    expect(routerMocks.push).toHaveBeenCalledWith('/');
  });

  it('honours the redirect query parameter', async () => {
    routerMocks.route.query = { redirect: '/shop' };
    const auth = useAuthStore();

    vi.spyOn(auth, 'login').mockResolvedValue();

    const wrapper = mount(LoginView, mountOptions);

    await fill(wrapper, 'player', 'Password1');
    await wrapper.get('form').trigger('submit');

    expect(routerMocks.push).toHaveBeenCalledWith('/shop');
  });

  it('shows the stored auth error and clears it on mount', async () => {
    const auth = useAuthStore();
    const clear = vi.spyOn(auth, 'clearError');

    mount(LoginView, mountOptions);
    expect(clear).toHaveBeenCalledTimes(1);

    const wrapper = mount(LoginView, mountOptions);

    auth.error = 'Неверный пароль';
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Неверный пароль');
  });

  it('keeps the page when login fails', async () => {
    const auth = useAuthStore();

    vi.spyOn(auth, 'login').mockRejectedValue(new Error('bad credentials'));

    const wrapper = mount(LoginView, mountOptions);

    await fill(wrapper, 'player', 'Password1');
    await wrapper.get('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it('links to the registration page', () => {
    const wrapper = mount(LoginView, mountOptions);

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/register');
  });
});

describe('RegisterView', () => {
  async function fill(
    wrapper: ReturnType<typeof mount>,
    values: { nickname: string; password: string; confirmation: string },
  ) {
    const inputs = wrapper.findAll('input');

    await inputs[0]?.setValue(values.nickname);
    await inputs[1]?.setValue(values.password);
    await inputs[2]?.setValue(values.confirmation);
  }

  function mountRegister() {
    return mount(RegisterView, mountOptions);
  }

  it.each([
    {
      values: {
        nickname: 'ab',
        password: 'Password1',
        confirmation: 'Password1',
      },
      error: 'Никнейм должен быть не короче 3 символов.',
    },
    {
      values: {
        nickname: 'a'.repeat(71),
        password: 'Password1',
        confirmation: 'Password1',
      },
      error: 'Никнейм должен быть не длиннее 70 символов.',
    },
    {
      values: {
        nickname: 'player',
        password: 'Short1',
        confirmation: 'Short1',
      },
      error: 'Пароль должен быть не короче 8 символов.',
    },
    {
      values: {
        nickname: 'player',
        password: 'PASSWORD1',
        confirmation: 'PASSWORD1',
      },
      error: 'Пароль должен содержать строчную букву.',
    },
    {
      values: {
        nickname: 'player',
        password: 'password1',
        confirmation: 'password1',
      },
      error: 'Пароль должен содержать заглавную букву.',
    },
    {
      values: {
        nickname: 'player',
        password: 'Password',
        confirmation: 'Password',
      },
      error: 'Пароль должен содержать цифру.',
    },
    {
      values: {
        nickname: 'player',
        password: 'Password1',
        confirmation: 'Password2',
      },
      error: 'Пароли не совпадают.',
    },
  ])('rejects invalid data: $error', async ({ values, error }) => {
    const auth = useAuthStore();
    const register = vi.spyOn(auth, 'register').mockResolvedValue();
    const wrapper = mountRegister();

    await fill(wrapper, values);
    await wrapper.get('form').trigger('submit');

    expect(wrapper.text()).toContain(error);
    expect(register).not.toHaveBeenCalled();
  });

  it('registers a new account and redirects home', async () => {
    const auth = useAuthStore();
    const register = vi.spyOn(auth, 'register').mockResolvedValue();
    const wrapper = mountRegister();

    await fill(wrapper, {
      nickname: '  player  ',
      password: 'Password1',
      confirmation: 'Password1',
    });
    await wrapper.get('form').trigger('submit');

    expect(register).toHaveBeenCalledWith({
      nickname: 'player',
      password: 'Password1',
      passwordConfirmation: 'Password1',
    });
    expect(routerMocks.push).toHaveBeenCalledWith('/');
  });

  it('shows the auth error and clears it on mount', async () => {
    const auth = useAuthStore();
    const clear = vi.spyOn(auth, 'clearError');

    const wrapper = mountRegister();

    expect(clear).toHaveBeenCalledTimes(1);

    auth.error = 'Никнейм занят';
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Никнейм занят');
  });

  it('keeps the page when registration fails', async () => {
    const auth = useAuthStore();

    vi.spyOn(auth, 'register').mockRejectedValue(new Error('taken'));

    const wrapper = mountRegister();

    await fill(wrapper, {
      nickname: 'player',
      password: 'Password1',
      confirmation: 'Password1',
    });
    await wrapper.get('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it('links to the login page', () => {
    const wrapper = mountRegister();

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/login');
  });
});
