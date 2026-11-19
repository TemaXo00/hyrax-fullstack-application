import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import AppButton from './AppButton.vue';
import AppCard from './AppCard.vue';
import AppIcon from './AppIcon.vue';
import CoinPill from './CoinPill.vue';
import EmptyState from './EmptyState.vue';
import ModalDialog from './ModalDialog.vue';
import Pager from './Pager.vue';
import PageTitle from './PageTitle.vue';
import ProgressBar from './ProgressBar.vue';
import SegmentedControl from './SegmentedControl.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('AppButton', () => {
  it('renders the slot and emits clicks', async () => {
    const wrapper = mount(AppButton, {
      slots: { default: 'Погладить' },
    });

    expect(wrapper.text()).toContain('Погладить');
    expect(wrapper.attributes('type')).toBe('button');

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('applies variant, size and block classes', () => {
    const wrapper = mount(AppButton, {
      props: { variant: 'danger', size: 'lg', block: true },
    });

    expect(wrapper.classes()).toContain('bg-clay');
    expect(wrapper.classes()).toContain('w-full');
    expect(wrapper.classes()).toContain('text-base');
  });

  it('shows a spinner and disables the button while loading', () => {
    const wrapper = mount(AppButton, { props: { loading: true } });

    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });
});

describe('AppCard', () => {
  it('renders content and applies tone and padding', () => {
    const plain = mount(AppCard, { slots: { default: 'Контент' } });
    const lilac = mount(AppCard, {
      props: { tone: 'lilac', padded: false },
      slots: { default: 'Контент' },
    });

    expect(plain.text()).toContain('Контент');
    expect(plain.classes()).toContain('p-5');
    expect(lilac.classes()).toContain('bg-lilac/45');
    expect(lilac.classes()).not.toContain('p-5');
  });
});

describe('AppIcon', () => {
  it('renders an svg with the requested size', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'coin', size: 28, strokeWidth: 2 },
    });

    const svg = wrapper.find('svg');

    expect(svg.exists()).toBe(true);
    expect(svg.attributes('width')).toBe('28');
    expect(svg.attributes('height')).toBe('28');
    expect(svg.attributes('stroke-width')).toBe('2');
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(wrapper.findAll('path').length).toBeGreaterThan(0);
  });
});

describe('CoinPill', () => {
  it('formats the value and hides the action by default', () => {
    const wrapper = mount(CoinPill, { props: { value: 1200 } });

    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('200');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('emits an action when the plus button is clicked', async () => {
    const wrapper = mount(CoinPill, {
      props: { value: '42', size: 'sm', action: true },
    });

    const button = wrapper.get('button[aria-label="Открыть магазин"]');

    await button.trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
  });
});

describe('EmptyState', () => {
  it('renders the title, description and icon', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Пусто',
        description: 'Купите еду',
        icon: 'bowl',
      },
    });

    expect(wrapper.text()).toContain('Пусто');
    expect(wrapper.text()).toContain('Купите еду');
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('hides the description when it is not provided', () => {
    const wrapper = mount(EmptyState, { props: { title: 'Пусто' } });

    expect(wrapper.findAll('p')).toHaveLength(1);
  });
});

describe('ModalDialog', () => {
  it('renders nothing when closed', () => {
    mount(ModalDialog, { props: { open: false, title: 'Диалог' } });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders into the body when open and emits close', async () => {
    const wrapper = mount(ModalDialog, {
      props: { open: true, title: 'Диалог', description: 'Описание' },
      slots: { default: '<p>Содержимое</p>' },
    });

    const dialog = document.querySelector('[role="dialog"]');

    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Диалог');
    expect(dialog?.textContent).toContain('Описание');
    expect(dialog?.textContent).toContain('Содержимое');

    const close = dialog?.querySelector(
      'button[aria-label="Закрыть"]',
    ) as HTMLButtonElement;

    close.click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});

describe('PageTitle', () => {
  it('renders title, subtitle and aside slot', () => {
    const wrapper = mount(PageTitle, {
      props: { title: 'Магазин', subtitle: 'Выберите товар' },
      slots: { aside: '<span>42</span>' },
    });

    expect(wrapper.text()).toContain('Магазин');
    expect(wrapper.text()).toContain('Выберите товар');
    expect(wrapper.text()).toContain('42');
  });

  it('shows a back button only when requested', async () => {
    const wrapper = mount(PageTitle, {
      props: { title: 'Профиль', back: true },
    });

    const back = wrapper.get('button[aria-label="Назад"]');

    await back.trigger('click');

    expect(wrapper.emitted('back')).toHaveLength(1);

    const withoutBack = mount(PageTitle, { props: { title: 'Профиль' } });

    expect(withoutBack.find('button').exists()).toBe(false);
  });
});

describe('Pager', () => {
  it('hides itself on a single page', () => {
    const wrapper = mount(Pager, { props: { page: 1, totalPages: 1 } });

    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('emits the previous and next pages', async () => {
    const wrapper = mount(Pager, { props: { page: 2, totalPages: 4 } });

    expect(wrapper.text()).toContain('2 / 4');

    await wrapper
      .get('button[aria-label="Предыдущая страница"]')
      .trigger('click');
    await wrapper
      .get('button[aria-label="Следующая страница"]')
      .trigger('click');

    expect(wrapper.emitted('change')).toEqual([[1], [3]]);
  });

  it('disables buttons at the edges', () => {
    const first = mount(Pager, { props: { page: 1, totalPages: 3 } });
    const last = mount(Pager, { props: { page: 3, totalPages: 3 } });

    expect(
      first
        .get('button[aria-label="Предыдущая страница"]')
        .attributes('disabled'),
    ).toBeDefined();
    expect(
      last
        .get('button[aria-label="Следующая страница"]')
        .attributes('disabled'),
    ).toBeDefined();
  });
});

describe('ProgressBar', () => {
  it('clamps the width and renders the label text', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 150,
        label: 'Опыт',
        valueText: '60 / 100',
        tone: 'clay',
      },
    });

    const bar = wrapper.get('.h-full');

    expect(bar.attributes('style')).toContain('width: 100%');
    expect(bar.classes()).toContain('bg-clay');
    expect(wrapper.text()).toContain('Опыт');
    expect(wrapper.text()).toContain('60 / 100');
  });

  it('clamps negative values to zero and supports compact mode', () => {
    const wrapper = mount(ProgressBar, {
      props: { value: -20, compact: true, tone: 'lilac' },
    });

    expect(wrapper.get('.h-full').attributes('style')).toContain('width: 0%');
    expect(wrapper.find('.h-2').exists()).toBe(true);
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'all', label: 'Все' },
    { value: 'food', label: 'Еда' },
  ] as const;

  it('highlights the selected option and emits changes', async () => {
    const wrapper = mount(SegmentedControl, {
      props: { modelValue: 'all', options: [...options] },
    });

    const buttons = wrapper.findAll('button');

    expect(buttons[0]?.classes()).toContain('bg-paper');
    expect(buttons[1]?.classes()).not.toContain('bg-paper');

    await buttons[1]?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['food']]);
  });

  it('supports the small size', () => {
    const wrapper = mount(SegmentedControl, {
      props: { modelValue: 'all', options: [...options], size: 'sm' },
    });

    expect(wrapper.get('button').classes()).toContain('text-[11px]');
  });
});
