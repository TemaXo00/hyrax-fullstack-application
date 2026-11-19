import { PET_SPECIES, PET_SPECIES_META } from '@org/api-client';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import FeedDialog from './FeedDialog.vue';
import PetActions from './PetActions.vue';
import PetSprite from './PetSprite.vue';
import PetStage from './PetStage.vue';
import PetStatus from './PetStatus.vue';
import RenameDialog from './RenameDialog.vue';
import SpeciesSwitch from './SpeciesSwitch.vue';

const mocks = vi.hoisted(() => ({
  game: null as null | Record<string, unknown>,
}));

vi.mock('@org/client-composables', async () => {
  const { ref: createRef } = await import('vue');

  mocks.game = {
    pet: createRef({ name: 'Авава' }),
    speciesMeta: createRef({ image: '/hyrax.png', label: 'Даман' }),
    clickReward: createRef(2),
    equippedBackground: createRef(null),
    equippedHat: createRef({ id: 'hat-1', name: 'Кепка', slot: 'HAT' }),
    equippedAccessory: createRef(null),
    click: vi.fn(),
    clickLimitLeft: vi.fn(() => 24),
  };

  return {
    usePetGame: () => mocks.game,
    useNow: () => createRef(Date.now()),
  };
});

function gameMock() {
  return mocks.game as {
    click: ReturnType<typeof vi.fn>;
    clickLimitLeft: ReturnType<typeof vi.fn>;
    pet: { value: { name: string } | null };
  };
}

const teleportStub = { global: { stubs: { teleport: true } } };

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('PetActions', () => {
  function mountActions(props: Record<string, unknown> = {}) {
    return mount(PetActions, {
      props: {
        pendingClicks: 0,
        cooldownSeconds: 0,
        busy: false,
        clickReward: 2,
        ...props,
      },
    });
  }

  it('offers a free walk once clicks are accumulated', async () => {
    const wrapper = mountActions({ pendingClicks: 12 });

    const walk = wrapper.get('button');

    expect(walk.text()).toContain('Погулять · 12');
    expect(walk.attributes('disabled')).toBeUndefined();

    await walk.trigger('click');

    expect(wrapper.emitted('walk')).toHaveLength(1);
  });

  it('shows the cooldown and disables walking', () => {
    const wrapper = mountActions({ pendingClicks: 5, cooldownSeconds: 12 });
    const walk = wrapper.get('button');

    expect(walk.text()).toContain('Отдых 12 с');
    expect(walk.attributes('disabled')).toBeDefined();
  });

  it('emits feed and pet actions', async () => {
    const wrapper = mountActions();
    const buttons = wrapper.findAll('button');

    await buttons[1]?.trigger('click');
    await buttons[2]?.trigger('click');

    expect(wrapper.emitted('feed')).toHaveLength(1);
    expect(wrapper.emitted('pet')).toHaveLength(1);
    expect(buttons[2]?.text()).toContain('+2');
  });
});

describe('PetSprite', () => {
  it('renders the image and toggles the pounce class', () => {
    const idle = mount(PetSprite, {
      props: { image: '/pet.png', alt: 'Даман' },
    });
    const pouncing = mount(PetSprite, {
      props: { image: '/pet.png', alt: 'Даман', pouncing: true },
    });

    expect(idle.get('img').attributes('src')).toBe('/pet.png');
    expect(idle.get('img').attributes('alt')).toBe('Даман');
    expect(idle.classes()).not.toContain('pet-pounce');
    expect(pouncing.classes()).toContain('pet-pounce');
  });
});

describe('PetStatus', () => {
  function mountStatus(autoIncome = 0) {
    return mount(PetStatus, {
      props: {
        level: 4,
        xp: 60,
        xpToNextLevel: 250,
        xpPercent: 24,
        mood: 90,
        hunger: 80,
        clickReward: 2,
        autoIncome,
      },
    });
  }

  it('renders level, xp and rewards', () => {
    const wrapper = mountStatus();

    expect(wrapper.text()).toContain('Уровень 4');
    expect(wrapper.text()).toContain('60 / 250 XP');
    expect(wrapper.text()).toContain('+2 за клик');
    expect(wrapper.text()).toContain('90');
    expect(wrapper.text()).toContain('80');
    expect(wrapper.text()).not.toContain('Автодоход');
  });

  it('shows auto income when it is positive', () => {
    const wrapper = mountStatus(3);

    expect(wrapper.text()).toContain('Автодоход: +3 монет в минуту');
  });
});

describe('RenameDialog', () => {
  it('starts with the current name and saves a trimmed value', async () => {
    const wrapper = mount(RenameDialog, {
      props: { initialName: 'Авава', busy: false },
      ...teleportStub,
    });

    const input = wrapper.get('input');

    expect((input.element as HTMLInputElement).value).toBe('Авава');

    await input.setValue('  Новое имя  ');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')).toEqual([['Новое имя']]);
  });

  it('rejects an empty name', async () => {
    const wrapper = mount(RenameDialog, {
      props: { initialName: 'Авава', busy: false },
      ...teleportStub,
    });

    await wrapper.get('input').setValue('   ');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')).toBeUndefined();
    expect(wrapper.text()).toContain('Имя не может быть пустым.');
  });

  it('closes through the cancel button and the modal close icon', async () => {
    const wrapper = mount(RenameDialog, {
      props: { initialName: 'Авава', busy: true },
      ...teleportStub,
    });

    await wrapper.findAll('button')[0]?.trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);

    await wrapper.get('button[aria-label="Закрыть"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(2);
    expect(wrapper.text()).toContain('Сохранить');
  });
});

describe('FeedDialog', () => {
  const inventory = [
    {
      id: 'inv-1',
      quantity: 2,
      food: {
        id: 'food-1',
        name: 'Морковка',
        hungerRestore: 15,
        moodBonus: 2,
      },
    },
    {
      id: 'inv-2',
      quantity: 1,
      food: {
        id: 'food-2',
        name: 'Арбуз',
        hungerRestore: 30,
        moodBonus: 5,
      },
    },
  ] as never;

  it('shows an empty state when there is no food', () => {
    const wrapper = mount(FeedDialog, {
      props: { open: true, inventory: [], busy: false },
      ...teleportStub,
    });

    expect(wrapper.text()).toContain('Инвентарь пуст');
    expect(wrapper.find('button.mt-4').exists()).toBe(false);
  });

  it('feeds the first item by default', async () => {
    const wrapper = mount(FeedDialog, {
      props: { open: true, inventory, busy: false },
      ...teleportStub,
    });

    expect(wrapper.text()).toContain('Морковка');
    expect(wrapper.text()).toContain('×2');
    expect(wrapper.text()).toContain('Скормить Морковка');

    const feed = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Скормить'));

    await feed?.trigger('click');

    expect(wrapper.emitted('feed')).toEqual([['food-1']]);
  });

  it('switches the selected food and closes', async () => {
    const wrapper = mount(FeedDialog, {
      props: { open: true, inventory, busy: false },
      ...teleportStub,
    });

    const itemButtons = wrapper
      .findAll('button')
      .filter((button) => button.text().includes('Арбуз'));

    await itemButtons[0]?.trigger('click');

    const feed = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Скормить'));

    expect(feed?.text()).toContain('Арбуз');

    await feed?.trigger('click');

    expect(wrapper.emitted('feed')).toEqual([['food-2']]);

    await wrapper.get('button[aria-label="Закрыть"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});

describe('SpeciesSwitch', () => {
  it('renders every species and emits the selected one', async () => {
    const wrapper = mount(SpeciesSwitch, {
      props: { species: PET_SPECIES[0] },
    });

    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(PET_SPECIES.length);
    expect(wrapper.text()).toContain(PET_SPECIES_META[PET_SPECIES[0]!].label);

    await buttons[1]?.trigger('click');

    expect(wrapper.emitted('change')).toEqual([[PET_SPECIES[1]]]);
  });
});

describe('PetStage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    gameMock().click.mockClear();
    gameMock().clickLimitLeft.mockReturnValue(24);
  });

  it('shows the pet, room and equipped cosmetics', () => {
    const wrapper = mount(PetStage);

    expect(wrapper.text()).toContain('Авава');
    expect(wrapper.text()).toContain('Кепка');
    expect(wrapper.text()).toContain('Тёплая комната');
    expect(wrapper.text()).toContain('Нажмите на питомца');
    expect(wrapper.get('img').attributes('src')).toBe('/hyrax.png');
  });

  it('emits editName and clicks the pet', async () => {
    const wrapper = mount(PetStage);

    await wrapper
      .get('button[aria-label="Переименовать питомца"]')
      .trigger('click');
    await wrapper
      .get('button[aria-label="Погладить питомца"]')
      .trigger('click');

    expect(wrapper.emitted('editName')).toHaveLength(1);
    expect(gameMock().click).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('+2');
  });

  it('ignores clicks while the pet is resting', async () => {
    gameMock().clickLimitLeft.mockReturnValue(0);

    const wrapper = mount(PetStage);

    expect(wrapper.text()).toContain('Питомец отдыхает');

    await wrapper
      .get('button[aria-label="Погладить питомца"]')
      .trigger('click');

    expect(gameMock().click).not.toHaveBeenCalled();
  });

  it('renders the fallback name when the pet is missing', () => {
    gameMock().pet.value = null;

    const wrapper = mount(PetStage);

    expect(wrapper.text()).toContain('Питомец');

    gameMock().pet.value = { name: 'Авава' };
  });
});
