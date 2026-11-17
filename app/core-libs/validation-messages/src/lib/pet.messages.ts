import { ADMIN_CONFIG, GAME_CONFIG } from '@org/validation-config';

export const PET_MESSAGES = {
  USER_NOT_FOUND: 'Пользователь не найден',
  PET_NOT_FOUND: 'Питомец не найден',
  STATISTICS_NOT_FOUND: 'Статистика игрока не найдена',
  WALK_COOLDOWN: (seconds: number): string =>
    `Питомец ещё отдыхает после выгула. Попробуйте через ${seconds} сек.`,
  INVALID_PET_ID: 'Некорректный идентификатор питомца',
  STORED_FOOD_NOT_FOUND: 'В инвентаре нет выбранной еды',
  NAME_VALIDATION: {
    NOT_EMPTY: 'Имя питомца не должно быть пустым',
    TYPE: 'Имя питомца должно быть строкой',
    LENGTH: `Имя питомца должно содержать от ${GAME_CONFIG.PET.NAME_MIN_LENGTH} до ${GAME_CONFIG.PET.NAME_MAX_LENGTH} символов`,
  },
  MOOD_VALIDATION: {
    TYPE: 'Настроение должно быть числом',
    RANGE: `Настроение должно быть от ${GAME_CONFIG.PET.MOOD_MIN} до ${GAME_CONFIG.PET.MOOD_MAX}`,
  },
  HUNGER_VALIDATION: {
    TYPE: 'Голод должен быть числом',
    RANGE: `Голод должен быть от ${GAME_CONFIG.PET.HUNGER_MIN} до ${GAME_CONFIG.PET.HUNGER_MAX}`,
  },
  WALK_CLICKS_VALIDATION: {
    TYPE: 'Количество кликов должно быть числом',
    MIN: `Минимальное количество кликов — ${GAME_CONFIG.WALK.CLICKS_MIN}`,
    MAX: `Максимальное количество кликов — ${GAME_CONFIG.WALK.CLICKS_MAX}`,
  },
  ADMIN_LEVEL_VALIDATION: {
    TYPE: 'Уровень питомца должен быть числом',
    MIN: `Минимальный уровень питомца — ${ADMIN_CONFIG.PET.LEVEL_MIN}`,
    MAX: `Максимальный уровень питомца — ${ADMIN_CONFIG.PET.LEVEL_MAX}`,
  },
  ADMIN_XP_VALIDATION: {
    TYPE: 'Опыт питомца должен быть числом',
    MIN: `Минимальный опыт питомца — ${ADMIN_CONFIG.PET.XP_MIN}`,
    MAX: `Максимальный опыт питомца — ${ADMIN_CONFIG.PET.XP_MAX}`,
  },
  ADMIN_STATISTICS_VALIDATION: {
    COINS: {
      TYPE: 'Количество монет должно быть числом',
      MIN: `Минимальное количество монет — ${ADMIN_CONFIG.STATISTICS.COUNT_MIN}`,
      MAX: `Максимальное количество монет — ${ADMIN_CONFIG.STATISTICS.COUNT_MAX}`,
    },
    TOTAL_COINS_EARNED: {
      TYPE: 'Количество заработанных монет должно быть числом',
      MIN: `Минимальное количество заработанных монет — ${ADMIN_CONFIG.STATISTICS.COUNT_MIN}`,
      MAX: `Максимальное количество заработанных монет — ${ADMIN_CONFIG.STATISTICS.COUNT_MAX}`,
    },
    TOTAL_CLICKS: {
      TYPE: 'Количество кликов должно быть числом',
      MIN: `Минимальное количество кликов — ${ADMIN_CONFIG.STATISTICS.COUNT_MIN}`,
      MAX: `Максимальное количество кликов — ${ADMIN_CONFIG.STATISTICS.COUNT_MAX}`,
    },
    TOTAL_FEEDS: {
      TYPE: 'Количество кормлений должно быть числом',
      MIN: `Минимальное количество кормлений — ${ADMIN_CONFIG.STATISTICS.COUNT_MIN}`,
      MAX: `Максимальное количество кормлений — ${ADMIN_CONFIG.STATISTICS.COUNT_MAX}`,
    },
    STREAK: {
      TYPE: 'Серия входов должна быть числом',
      MIN: `Минимальная серия входов — ${ADMIN_CONFIG.STATISTICS.STREAK_MIN}`,
      MAX: `Максимальная серия входов — ${ADMIN_CONFIG.STATISTICS.STREAK_MAX}`,
    },
    CLICK_POWER: {
      TYPE: 'Сила клика должна быть числом',
      MIN: `Минимальная сила клика — ${ADMIN_CONFIG.STATISTICS.CLICK_POWER_MIN}`,
      MAX: `Максимальная сила клика — ${ADMIN_CONFIG.STATISTICS.CLICK_POWER_MAX}`,
    },
    AUTO_INCOME: {
      TYPE: 'Пассивный доход должен быть числом',
      MIN: `Минимальный пассивный доход — ${ADMIN_CONFIG.STATISTICS.AUTO_INCOME_MIN}`,
      MAX: `Максимальный пассивный доход — ${ADMIN_CONFIG.STATISTICS.AUTO_INCOME_MAX}`,
    },
  },
} as const;
