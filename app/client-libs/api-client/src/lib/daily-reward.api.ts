import { DAILY_REWARD_ROUTES } from '@org/types';

import { request } from './http';

import type { Serialized } from './types';
import type { DailyRewardClaimEntity, DailyRewardStateEntity } from '@org/types';

export type DailyRewardState = Serialized<DailyRewardStateEntity>;
export type DailyRewardClaim = Serialized<DailyRewardClaimEntity>;

export async function getDailyRewardState(): Promise<DailyRewardState> {
  return await request<DailyRewardState>(
    `/${DAILY_REWARD_ROUTES.BASE}/${DAILY_REWARD_ROUTES.STATE}`,
    { method: 'QUERY', body: {} },
  );
}

export async function claimDailyReward(): Promise<DailyRewardClaim> {
  return await request<DailyRewardClaim>(
    `/${DAILY_REWARD_ROUTES.BASE}/${DAILY_REWARD_ROUTES.CLAIM}`,
    { method: 'POST' },
  );
}
