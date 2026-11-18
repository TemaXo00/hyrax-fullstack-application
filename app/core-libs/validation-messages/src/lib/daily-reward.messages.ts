import { DAILY_REWARD_CONFIG } from '@org/validation-config';

export const DAILY_REWARD_MESSAGES = {
  ALREADY_CLAIMED: 'Ежедневная награда за сегодня уже получена',
  CONFIG_NOT_FOUND: 'Конфигурация ежедневной награды не найдена',
  REWARD_ITEM_NOT_FOUND: 'Косметика для награды не найдена',
  PLAYER_NOT_FOUND: 'Игрок не найден',
  DAY_VALIDATION: {
    TYPE: 'Номер дня должен быть числом',
    MIN: `Минимальный номер дня — ${DAILY_REWARD_CONFIG.DAY_MIN}`,
    MAX: `Максимальный номер дня — ${DAILY_REWARD_CONFIG.DAY_MAX}`,
  },
  REWARD_COINS_VALIDATION: {
    TYPE: 'Награда в монетах должна быть числом',
    MIN: `Минимальная награда — ${DAILY_REWARD_CONFIG.REWARD_COINS_MIN}`,
    MAX: `Максимальная награда — ${DAILY_REWARD_CONFIG.REWARD_COINS_MAX}`,
  },
  REWARD_ITEM_VALIDATION: {
    TYPE: 'Идентификатор предмета должен быть строкой',
  },
} as const;
