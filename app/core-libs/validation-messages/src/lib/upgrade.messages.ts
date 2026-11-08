export const UPGRADE_MESSAGES = {
  NOT_FOUND: 'Улучшение не найдено',
  MAX_LEVEL_REACHED: 'Улучшение уже имеет максимальный уровень',
  MAX_LEVEL_REACHED_WITH_VALUE: (level: number): string =>
    `Улучшение уже имеет максимальный уровень ${level}`,
} as const;
