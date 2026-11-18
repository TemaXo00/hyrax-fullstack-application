import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_LEADERBOARD_METRIC, LEADERBOARD_METRICS } from '@org/types';

import { PaginationMetaResponseDto } from '../shared/pagination-response.dto';

import type {
  LeaderboardEntryEntity,
  LeaderboardMetric,
  LeaderboardPositionEntity,
  PaginatedLeaderboardOutput,
} from '@org/types';

export class LeaderboardEntryResponseDto implements LeaderboardEntryEntity {
  @ApiProperty({ description: 'Место в рейтинге', example: 1 })
  rank: number;

  @ApiProperty({ description: 'Идентификатор игрока' })
  userId: string;

  @ApiProperty({ description: 'Никнейм игрока', example: 'joe_doe' })
  nickname: string;

  @ApiProperty({
    description: 'Имя питомца',
    example: 'Барсик',
    nullable: true,
    required: false,
  })
  petName: string | null;

  @ApiProperty({
    description: 'Уровень питомца',
    example: 7,
    nullable: true,
    required: false,
  })
  petLevel: number | null;

  @ApiProperty({
    description: 'Значение метрики рейтинга',
    example: '1500',
  })
  value: string;
}

export class PaginatedLeaderboardResponseDto implements PaginatedLeaderboardOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({
    description: 'Метрика рейтинга',
    enum: LEADERBOARD_METRICS,
    example: DEFAULT_LEADERBOARD_METRIC,
  })
  metric: LeaderboardMetric;

  @ApiProperty({
    description: 'Название метрики рейтинга',
    example: 'Всего заработано монет',
  })
  metricLabel: string;

  @ApiProperty({
    description: 'Записи рейтинга',
    type: [LeaderboardEntryResponseDto],
  })
  entries: LeaderboardEntryResponseDto[];
}

export class LeaderboardPositionResponseDto implements LeaderboardPositionEntity {
  @ApiProperty({
    description: 'Метрика рейтинга',
    enum: LEADERBOARD_METRICS,
    example: DEFAULT_LEADERBOARD_METRIC,
  })
  metric: LeaderboardMetric;

  @ApiProperty({
    description: 'Название метрики рейтинга',
    example: 'Всего заработано монет',
  })
  metricLabel: string;

  @ApiProperty({
    description:
      'Место игрока в рейтинге. 0, если игрок не участвует в рейтинге',
    example: 3,
  })
  rank: number;

  @ApiProperty({
    description: 'Значение метрики игрока',
    example: '1500',
  })
  value: string;

  @ApiProperty({
    description: 'Количество игроков в рейтинге',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Участвует ли игрок в рейтинге',
    example: true,
  })
  isRanked: boolean;
}
