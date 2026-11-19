import { ACHIEVEMENT_ROUTES } from '@org/types';

import { request } from './http';

import type { PaginationInput, Serialized } from './types';
import type {
  AchievementClaimEntity,
  AchievementCondition,
  PaginatedAchievementsOutput,
} from '@org/types';

export type PaginatedAchievements = Serialized<PaginatedAchievementsOutput>;
export type AchievementClaim = Serialized<AchievementClaimEntity>;

export interface AchievementsQuery extends PaginationInput {
  conditionType?: AchievementCondition;
}

export async function getAchievements(
  query: AchievementsQuery = {},
): Promise<PaginatedAchievements> {
  return await request<PaginatedAchievements>(`/${ACHIEVEMENT_ROUTES.BASE}`, {
    method: 'QUERY',
    body: query,
  });
}

export async function claimAchievement(
  achievementId: string,
): Promise<AchievementClaim> {
  return await request<AchievementClaim>(
    `/${ACHIEVEMENT_ROUTES.BASE}/${achievementId}/claim`,
    { method: 'POST' },
  );
}
