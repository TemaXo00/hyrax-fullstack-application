import {
  ACHIEVEMENT_ROUTES,
  AUTH_ROUTES,
  COSMETIC_SHOP_ROUTES,
  DAILY_REWARD_ROUTES,
  FOOD_SHOP_ROUTES,
  LEADERBOARD_ROUTES,
  PET_ROUTES,
  UPGRADE_SHOP_ROUTES,
} from '@org/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { claimAchievement, getAchievements } from './achievements.api';
import { getMe, login, logout, register } from './auth.api';
import { claimDailyReward, getDailyRewardState } from './daily-reward.api';
import { request } from './http';
import { getLeaderboard, getMyLeaderboardPosition } from './leaderboard.api';
import { clickPet, feedPet, getPetState, renamePet, walkPet } from './pet.api';
import {
  buyCosmetic,
  buyFood,
  buyUpgrade,
  equipCosmetic,
  getCosmetics,
  getFoods,
  getUpgrades,
} from './shop.api';

vi.mock('./http', () => ({
  request: vi.fn(),
}));

const mockedRequest = vi.mocked(request);

beforeEach(() => {
  mockedRequest.mockReset();
  mockedRequest.mockResolvedValue(undefined);
});

describe('auth api', () => {
  it('calls auth routes', async () => {
    await register({
      nickname: 'player',
      password: 'Password1',
      passwordConfirmation: 'Password1',
    });
    await login({ nickname: 'player', password: 'Password1' });
    await logout();
    await getMe();

    expect(mockedRequest).toHaveBeenNthCalledWith(
      1,
      `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REGISTER}`,
      expect.objectContaining({ method: 'POST', retryOnUnauthorized: false }),
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      2,
      `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.LOGIN}`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      3,
      `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.LOGOUT}`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      4,
      `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.ME}`,
    );
  });
});

describe('pet api', () => {
  it('calls pet routes with payloads', async () => {
    await getPetState();
    await renamePet('Авава');
    await clickPet();
    await walkPet(12);
    await feedPet('food-1');

    const base = `/${PET_ROUTES.BASE}`;

    expect(mockedRequest).toHaveBeenNthCalledWith(
      1,
      `${base}/${PET_ROUTES.STATE}`,
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      2,
      `${base}/${PET_ROUTES.RENAME}`,
      { method: 'PATCH', body: { name: 'Авава' } },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      3,
      `${base}/${PET_ROUTES.CLICK}`,
      { method: 'POST' },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      4,
      `${base}/${PET_ROUTES.WALK}`,
      { method: 'POST', body: { clicks: 12 } },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      5,
      `${base}/${PET_ROUTES.FEED}`,
      { method: 'POST', body: { foodId: 'food-1' } },
    );
  });
});

describe('shop api', () => {
  it('queries catalogs and sends purchase actions', async () => {
    await getFoods({ page: 2 });
    await buyFood('food-1', 3);
    await getCosmetics({ page: 1 });
    await buyCosmetic('cosmetic-1');
    await equipCosmetic('cosmetic-1', true);
    await getUpgrades();
    await buyUpgrade('upgrade-1');

    expect(mockedRequest).toHaveBeenNthCalledWith(
      1,
      `/${FOOD_SHOP_ROUTES.BASE}`,
      { method: 'QUERY', body: { page: 2 } },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      2,
      `/${FOOD_SHOP_ROUTES.BASE}/food-1/buy`,
      { method: 'POST', body: { quantity: 3 } },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      3,
      `/${COSMETIC_SHOP_ROUTES.BASE}`,
      { method: 'QUERY', body: { page: 1 } },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      4,
      `/${COSMETIC_SHOP_ROUTES.BASE}/cosmetic-1/buy`,
      { method: 'POST' },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      5,
      `/${COSMETIC_SHOP_ROUTES.BASE}/cosmetic-1/equip`,
      { method: 'PATCH', body: { equipped: true } },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      6,
      `/${UPGRADE_SHOP_ROUTES.BASE}`,
      { method: 'QUERY', body: {} },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      7,
      `/${UPGRADE_SHOP_ROUTES.BASE}/upgrade-1/buy`,
      { method: 'POST' },
    );
  });
});

describe('progress api', () => {
  it('queries achievements, rewards and leaderboard', async () => {
    await getAchievements({ page: 1, conditionType: 'LEVEL' });
    await claimAchievement('achievement-1');
    await getDailyRewardState();
    await claimDailyReward();
    await getLeaderboard({ metric: 'TOTAL_CLICKS' });
    await getMyLeaderboardPosition('STREAK');

    expect(mockedRequest).toHaveBeenNthCalledWith(
      1,
      `/${ACHIEVEMENT_ROUTES.BASE}`,
      { method: 'QUERY', body: { page: 1, conditionType: 'LEVEL' } },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      2,
      `/${ACHIEVEMENT_ROUTES.BASE}/achievement-1/claim`,
      { method: 'POST' },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      3,
      `/${DAILY_REWARD_ROUTES.BASE}/${DAILY_REWARD_ROUTES.STATE}`,
      { method: 'QUERY', body: {} },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      4,
      `/${DAILY_REWARD_ROUTES.BASE}/${DAILY_REWARD_ROUTES.CLAIM}`,
      { method: 'POST' },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      5,
      `/${LEADERBOARD_ROUTES.BASE}`,
      { method: 'QUERY', body: { metric: 'TOTAL_CLICKS' } },
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      6,
      `/${LEADERBOARD_ROUTES.BASE}/${LEADERBOARD_ROUTES.MY_POSITION}`,
      { method: 'QUERY', body: { metric: 'STREAK' } },
    );
  });
});
