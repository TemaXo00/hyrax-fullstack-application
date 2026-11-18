import type { PaginationMeta } from '../shared/pagination.types.js';

export const LEADERBOARD_METRICS = [
  'TOTAL_COINS_EARNED',
  'TOTAL_CLICKS',
  'PET_LEVEL',
  'STREAK',
] as const;

export type LeaderboardMetric = (typeof LEADERBOARD_METRICS)[number];

export const DEFAULT_LEADERBOARD_METRIC: LeaderboardMetric =
  'TOTAL_COINS_EARNED';

export const LEADERBOARD_METRIC_LABELS: Record<LeaderboardMetric, string> = {
  TOTAL_COINS_EARNED: 'Всего заработано монет',
  TOTAL_CLICKS: 'Всего кликов',
  PET_LEVEL: 'Уровень питомца',
  STREAK: 'Серия входов',
};

export const LEADERBOARD_METRIC_OPTIONS = LEADERBOARD_METRICS.map(
  (metric) => LEADERBOARD_METRIC_LABELS[metric],
).join(', ');

export const getLeaderboardMetricLabel = (metric: LeaderboardMetric): string =>
  LEADERBOARD_METRIC_LABELS[metric];

export interface LeaderboardEntryEntity {
  rank: number;
  userId: string;
  nickname: string;
  petName: string | null;
  petLevel: number | null;
  value: string;
}

export interface PaginatedLeaderboardOutput {
  pagination: PaginationMeta;
  metric: LeaderboardMetric;
  metricLabel: string;
  entries: LeaderboardEntryEntity[];
}

export interface LeaderboardPositionEntity {
  metric: LeaderboardMetric;
  metricLabel: string;
  rank: number;
  value: string;
  total: number;
  isRanked: boolean;
}

export interface LeaderboardQueryInput {
  page?: number;
  limit?: number;
  metric?: LeaderboardMetric;
}

export interface LeaderboardPositionInput {
  metric?: LeaderboardMetric;
}
