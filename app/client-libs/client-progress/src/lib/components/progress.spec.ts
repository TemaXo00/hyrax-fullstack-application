import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AchievementItem from './AchievementItem.vue';
import DailyRewardCard from './DailyRewardCard.vue';
import LeaderboardList from './LeaderboardList.vue';

function achievement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'achievement-1',
    title: 'Первые шаги',
    description: 'Сделайте 10 кликов',
    conditionType: 'TOTAL_CLICKS',
    conditionTypeLabel: 'Клики',
    conditionValue: 10,
    progress: 5,
    rewardCoins: 50,
    isUnlocked: false,
    isClaimed: false,
    ...overrides,
  } as never;
}

describe('AchievementItem', () => {
  it('renders locked progress', () => {
    const wrapper = mount(AchievementItem, {
      props: { achievement: achievement(), loading: false },
    });

    expect(wrapper.text()).toContain('Первые шаги');
    expect(wrapper.text()).toContain('Сделайте 10 кликов');
    expect(wrapper.text()).toContain('5 / 10');
    expect(wrapper.text()).toContain('закрыто');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('clamps progress and claims an unlocked achievement', async () => {
    const wrapper = mount(AchievementItem, {
      props: {
        achievement: achievement({ progress: 25, isUnlocked: true }),
        loading: false,
      },
    });

    expect(wrapper.text()).toContain('10 / 10');

    const button = wrapper.get('button');

    expect(button.text()).toBe('Забрать');
    expect(button.classes()).toContain('bg-moss');

    await button.trigger('click');

    expect(wrapper.emitted('claim')).toHaveLength(1);
  });

  it('shows the claimed state and loading spinner', () => {
    const claimed = mount(AchievementItem, {
      props: {
        achievement: achievement({
          progress: 10,
          isUnlocked: true,
          isClaimed: true,
        }),
        loading: false,
      },
    });

    expect(claimed.text()).toContain('получено');
    expect(claimed.find('button').exists()).toBe(false);

    const loading = mount(AchievementItem, {
      props: {
        achievement: achievement({ isUnlocked: true }),
        loading: true,
      },
    });

    expect(loading.find('button').attributes('disabled')).toBeDefined();
    expect(loading.find('.animate-spin').exists()).toBe(true);
  });

  it('picks an icon for every condition type', () => {
    const feeds = mount(AchievementItem, {
      props: {
        achievement: achievement({ conditionType: 'TOTAL_FEEDS' }),
        loading: false,
      },
    });
    const level = mount(AchievementItem, {
      props: {
        achievement: achievement({ conditionType: 'LEVEL' }),
        loading: false,
      },
    });
    const streak = mount(AchievementItem, {
      props: {
        achievement: achievement({ conditionType: 'STREAK' }),
        loading: false,
      },
    });
    const coins = mount(AchievementItem, {
      props: {
        achievement: achievement({ conditionType: 'TOTAL_COINS_EARNED' }),
        loading: false,
      },
    });

    expect(feeds.findAll('path').length).toBeGreaterThan(1);
    expect(level.find('svg').exists()).toBe(true);
    expect(streak.find('svg').exists()).toBe(true);
    expect(coins.find('svg').exists()).toBe(true);
  });
});

function rewardState(overrides: Record<string, unknown> = {}) {
  return {
    canClaim: true,
    dayNumber: 2,
    currentStreak: 1,
    bestStreak: 3,
    rewards: [
      { id: 'day-2', dayNumber: 2, rewardCoins: 25, rewardItem: null },
      { id: 'day-1', dayNumber: 1, rewardCoins: 10, rewardItem: null },
      {
        id: 'day-3',
        dayNumber: 3,
        rewardCoins: 40,
        rewardItem: { id: 'item-1' },
      },
    ],
    ...overrides,
  } as never;
}

describe('DailyRewardCard', () => {
  it('renders streaks and sorted days', () => {
    const wrapper = mount(DailyRewardCard, {
      props: { state: rewardState(), claiming: false },
    });

    expect(wrapper.text()).toContain('Серия: 1 · лучшая: 3');

    const days = wrapper.findAll('.grid-cols-7 > div').map((day) => day.text());

    expect(days[0]).toContain('1');
    expect(days[1]).toContain('2');
    expect(days[2]).toContain('3');
    expect(days[2]).toContain('★');
  });

  it('claims the reward', async () => {
    const wrapper = mount(DailyRewardCard, {
      props: { state: rewardState(), claiming: false },
    });

    const button = wrapper.get('button');

    expect(button.text()).toContain('Забрать награду');

    await button.trigger('click');

    expect(wrapper.emitted('claim')).toHaveLength(1);
  });

  it('shows a message when the reward is already claimed', () => {
    const wrapper = mount(DailyRewardCard, {
      props: {
        state: rewardState({ canClaim: false }),
        claiming: false,
      },
    });

    expect(wrapper.text()).toContain('Награда за сегодня уже получена');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('handles empty state and loading', () => {
    const empty = mount(DailyRewardCard, {
      props: { state: null, claiming: false },
    });

    expect(empty.text()).toContain('Серия: 0 · лучшая: 0');
    expect(empty.text()).toContain('Награда за сегодня уже получена');

    const loading = mount(DailyRewardCard, {
      props: { state: rewardState(), claiming: true },
    });

    expect(loading.get('button').attributes('disabled')).toBeDefined();
  });
});

function board(overrides: Record<string, unknown> = {}) {
  return {
    entries: [
      {
        rank: 1,
        userId: 'user-1',
        nickname: 'Alina',
        petName: 'Авава',
        petLevel: 5,
        value: 120,
      },
      {
        rank: 2,
        userId: 'user-2',
        nickname: 'Boris',
        petName: null,
        petLevel: null,
        value: 80,
      },
    ],
    pagination: { page: 1, totalPages: 3 },
    ...overrides,
  } as never;
}

const position = {
  isRanked: true,
  rank: 4,
  metricLabel: 'Всего кликов',
  value: 40,
} as never;

describe('LeaderboardList', () => {
  it('shows skeletons while loading without a board', () => {
    const wrapper = mount(LeaderboardList, {
      props: {
        board: null,
        myPosition: null,
        currentNickname: 'Alina',
        loading: true,
      },
    });

    expect(wrapper.findAll('.animate-pulse')).toHaveLength(6);
  });

  it('shows the empty state without entries', () => {
    const wrapper = mount(LeaderboardList, {
      props: {
        board: null,
        myPosition: null,
        currentNickname: 'Alina',
        loading: false,
      },
    });

    expect(wrapper.text()).toContain('Рейтинг пока пуст');
  });

  it('renders entries, my position and highlights the current user', () => {
    const wrapper = mount(LeaderboardList, {
      props: {
        board: board(),
        myPosition: position,
        currentNickname: 'Alina',
        loading: false,
      },
    });

    expect(wrapper.text()).toContain('Ваша позиция');
    expect(wrapper.text()).toContain('Всего кликов');
    expect(wrapper.text()).toContain('#4');
    expect(wrapper.text()).toContain('Alina');
    expect(wrapper.text()).toContain('Авава');
    expect(wrapper.text()).toContain('ур. 5');
    expect(wrapper.text()).toContain('Boris');
    expect(wrapper.text()).toContain('Без питомца');
    expect(wrapper.get('.bg-butter').text()).toBe('1');

    const rows = wrapper.findAll('.border-b');

    expect(rows[0]?.classes()).toContain('bg-[#f1f4ea]');
    expect(rows[1]?.classes()).not.toContain('bg-[#f1f4ea]');
  });

  it('marks unranked users', () => {
    const wrapper = mount(LeaderboardList, {
      props: {
        board: board(),
        myPosition: { ...position, isRanked: false } as never,
        currentNickname: 'Alina',
        loading: false,
      },
    });

    expect(wrapper.text()).toContain('—');
  });

  it('emits page changes', async () => {
    const wrapper = mount(LeaderboardList, {
      props: {
        board: board(),
        myPosition: null,
        currentNickname: 'Alina',
        loading: false,
      },
    });

    await wrapper
      .get('button[aria-label="Следующая страница"]')
      .trigger('click');

    expect(wrapper.emitted('change')).toEqual([[2]]);
  });
});
