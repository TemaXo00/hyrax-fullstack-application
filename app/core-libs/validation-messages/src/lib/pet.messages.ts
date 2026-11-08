import { GAME_CONFIG } from '@org/validation-config';

export const PET_MESSAGES = {
  USER_NOT_FOUND: 'Пользователь не найден',
  PET_NOT_FOUND: 'Питомец не найден',
  STATISTICS_NOT_FOUND: 'Статистика игрока не найдена',
  WALK_COOLDOWN: (seconds: number): string =>
    `Питомец ещё отдыхает после выгула. Попробуйте через ${seconds} сек.`,
  INVALID_PET_ID: 'Некорректный идентификатор питомца',
  STORED_FOOD_NOT_FOUND: 'В инвентаре нет выбранной еды',
  WS_ACTION_TOO_FAST: 'Слишком частое игровое действие. Подождите немного.',
  INTERNAL_ERROR: 'Внутренняя ошибка игрового сервера',
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
} as const;
