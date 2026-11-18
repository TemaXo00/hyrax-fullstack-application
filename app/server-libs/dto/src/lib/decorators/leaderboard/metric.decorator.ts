import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_LEADERBOARD_METRIC, LEADERBOARD_METRICS } from '@org/types';
import { LEADERBOARD_MESSAGES } from '@org/validation-messages';
import { IsIn, IsOptional } from 'class-validator';

export function LeaderboardMetricField(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Метрика рейтинга',
      enum: LEADERBOARD_METRICS,
      example: DEFAULT_LEADERBOARD_METRIC,
      required: false,
      type: 'string',
    }),
    IsOptional(),
    IsIn([...LEADERBOARD_METRICS], {
      message: LEADERBOARD_MESSAGES.METRIC_VALIDATION.INVALID,
    }),
  );
}
