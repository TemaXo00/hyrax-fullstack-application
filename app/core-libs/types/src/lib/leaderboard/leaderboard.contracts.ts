import type {
  LeaderboardPositionEntity,
  LeaderboardPositionInput,
  LeaderboardQueryInput,
  PaginatedLeaderboardOutput,
} from './leaderboard.types.js';

export interface LeaderboardServiceContract {
  getLeaderboard(
    query: LeaderboardQueryInput,
  ): Promise<PaginatedLeaderboardOutput>;
  getMyPosition(
    userId: string,
    input: LeaderboardPositionInput,
  ): Promise<LeaderboardPositionEntity>;
}
