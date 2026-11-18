import { LEADERBOARD_METRIC_OPTIONS } from '@org/types';

export const LEADERBOARD_MESSAGES = {
  PLAYER_NOT_FOUND: 'Игрок не найден',
  METRIC_VALIDATION: {
    INVALID: `Недопустимая метрика рейтинга. Доступные варианты: ${LEADERBOARD_METRIC_OPTIONS}`,
  },
} as const;
