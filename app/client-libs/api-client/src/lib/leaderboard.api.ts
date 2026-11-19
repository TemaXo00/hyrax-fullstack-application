import { LEADERBOARD_ROUTES } from '@org/types';

import { request } from './http';

import type { Serialized } from './types';
import type {
  LeaderboardMetric,
  LeaderboardPositionEntity,
  PaginatedLeaderboardOutput,
} from '@org/types';

export type PaginatedLeaderboard = Serialized<PaginatedLeaderboardOutput>;
export type LeaderboardPosition = Serialized<LeaderboardPositionEntity>;

export interface LeaderboardQuery {
  page?: number;
  limit?: number;
  metric?: LeaderboardMetric;
}

export async function getLeaderboard(
  query: LeaderboardQuery = {},
): Promise<PaginatedLeaderboard> {
  return await request<PaginatedLeaderboard>(`/${LEADERBOARD_ROUTES.BASE}`, {
    method: 'QUERY',
    body: query,
  });
}

export async function getMyLeaderboardPosition(
  metric?: LeaderboardMetric,
): Promise<LeaderboardPosition> {
  return await request<LeaderboardPosition>(
    `/${LEADERBOARD_ROUTES.BASE}/${LEADERBOARD_ROUTES.MY_POSITION}`,
    { method: 'QUERY', body: { metric } },
  );
}
