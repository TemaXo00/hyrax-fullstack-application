import { useAuthStore, useUiStore } from '@org/api-client';
import { RouterLinkStub, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AppShell from './AppShell.vue';
import AuthLayout from './AuthLayout.vue';
import ToastHost from '../components/ToastHost.vue';

const mocks = vi.hoisted(() => ({
  game: null as null | Record<string, unknown>,
}));

vi.mock('@org/client-composables', async () => {
  const { ref } = await import('vue');

  mocks.game = {
    pet: ref({ name: 'Авава' }),
    coins: ref(120),
    speciesMeta: ref({ label: 'Даман', image: '/hyrax.png' }),
    loadState: vi.fn(),
  };

  return { usePetGame: () => mocks.game };
});

function game() {
  return mocks.game as {
    pet: { value: { name: string } | null };
    coins: { value: number };
    loadState: ReturnType<typeof vi.fn>;
  };
}

let push: ReturnType<typeof vi.fn>;
let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
  game().pet.value = { name: 'Авава' };
  push = vi.fn();
});

describe('AuthLayout', () => {
  it('renders the brand, title, subtitle and slot', () => {
    const wrapper = mount(AuthLayout, {
      props: {
        title: 'С возвращением',
        subtitle: 'Войдите в аккаунт',
      },
      slots: { default: '<form class="login-form">Форма</form>' },
    });

    expect(wrapper.text()).toContain('Hyrax');
    expect(wrapper.text()).toContain('С возвращением');
    expect(wrapper.text()).toContain('Войдите в аккаунт');
    expect(wrapper.find('.login-form').exists()).toBe(true);
    expect(wrapper.get('img').attributes('src')).toBe('/pets/hyrax.png');
  });
});

describe('AppShell', () => {
  function mountShell() {
    return mount(AppShell, {
      global: {
        stubs: { RouterLink: RouterLinkStub, RouterView: true },
        mocks: { $router: { push } },
      },
    });
  }

  it('renders navigation, coins and the user profile link', () => {
    useAuthStore().user = { nickname: 'Alina' } as never;

    const wrapper = mountShell();
    const links = wrapper.findAllComponents(RouterLinkStub);
    const targets = links.map((link) => link.props('to'));

    expect(wrapper.text()).toContain('Hyrax');
    expect(wrapper.text()).toContain('Alina');
    expect(wrapper.text()).toContain('120');
    expect(targets).toEqual(
      expect.arrayContaining([
        '/',
        '/shop',
        '/achievements',
        '/leaderboard',
        '/profile',
      ]),
    );

    for (const label of [
      'Главная',
      'Магазин',
      'Достижения',
      'Рейтинг',
      'Профиль',
    ]) {
      expect(wrapper.text()).toContain(label);
    }

    expect(wrapper.get('img').attributes('src')).toBe('/hyrax.png');
  });

  it('opens the shop from the coin action', async () => {
    const wrapper = mountShell();

    await wrapper.get('button[aria-label="Открыть магазин"]').trigger('click');

    expect(push).toHaveBeenCalledWith('/shop');
  });

  it('loads the pet state only when it is missing', () => {
    game().pet.value = null;

    mountShell();

    expect(game().loadState).toHaveBeenCalledTimes(1);

    game().pet.value = { name: 'Авава' };

    mountShell();

    expect(game().loadState).toHaveBeenCalledTimes(1);
  });
});

describe('ToastHost', () => {
  it('renders alerts with tone styles and dismisses them', async () => {
    const ui = useUiStore();

    ui.push('Всё хорошо', 'success');
    ui.push('Что-то сломалось', 'error');
    ui.push('Просто заметка', 'info');

    const wrapper = mount(ToastHost, {
      global: { plugins: [pinia] },
    });

    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(3);
    expect(buttons[0]?.text()).toContain('Всё хорошо');
    expect(buttons[0]?.classes()).toContain('bg-[#e9f0e0]');
    expect(buttons[1]?.text()).toContain('Что-то сломалось');
    expect(buttons[1]?.classes()).toContain('bg-[#f9e4df]');
    expect(buttons[2]?.classes()).toContain('bg-paper');

    await buttons[2]?.trigger('click');

    expect(wrapper.findAll('button')).toHaveLength(2);
  });
});
