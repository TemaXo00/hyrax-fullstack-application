import {
  DEFAULT_LEADERBOARD_METRIC,
  type LeaderboardMetric,
  type LeaderboardPositionInput,
  type LeaderboardQueryInput,
} from '@org/types';
import { SHARED_CONFIG } from '@org/validation-config';

import { LeaderboardMetricField } from '../decorators/leaderboard/metric.decorator';
import { Limit } from '../decorators/pagination/limit.decorator';
import { Page } from '../decorators/pagination/page.decorator';

export class LeaderboardQueryDto implements LeaderboardQueryInput {
  @Page()
  page?: number = SHARED_CONFIG.PAGINATION.DEFAULT_PAGE;

  @Limit()
  limit?: number = SHARED_CONFIG.PAGINATION.DEFAULT_LIMIT;

  @LeaderboardMetricField()
  metric?: LeaderboardMetric = DEFAULT_LEADERBOARD_METRIC;
}

export class LeaderboardPositionDto implements LeaderboardPositionInput {
  @LeaderboardMetricField()
  metric?: LeaderboardMetric = DEFAULT_LEADERBOARD_METRIC;
}
