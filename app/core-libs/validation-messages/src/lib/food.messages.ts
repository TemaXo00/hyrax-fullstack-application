import { ADMIN_CONFIG, GAME_CONFIG } from '@org/validation-config';

export const FOOD_MESSAGES = {
  NOT_FOUND: 'Еда не найдена',
  INACTIVE: 'Эта еда недоступна для покупки',
  NOT_IN_INVENTORY: 'В инвентаре нет выбранной еды',
  DELETE_CONFLICT:
    'Нельзя удалить еду, пока она есть в инвентаре хотя бы одного игрока',
  QUANTITY_VALIDATION: {
    TYPE: 'Количество должно быть числом',
    MIN: `Минимальное количество — ${GAME_CONFIG.FOOD.QUANTITY_MIN}`,
    MAX: `Максимальное количество — ${GAME_CONFIG.FOOD.QUANTITY_MAX}`,
  },
  NAME_VALIDATION: {
    NOT_EMPTY: 'Название еды не должно быть пустым',
    TYPE: 'Название еды должно быть строкой',
    LENGTH: `Название еды должно содержать от ${ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH} до ${ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH} символов`,
  },
  DESCRIPTION_VALIDATION: {
    TYPE: 'Описание еды должно быть строкой',
    MAX: `Описание еды должно содержать не более ${ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH} символов`,
  },
  PRICE_VALIDATION: {
    TYPE: 'Цена должна быть числом',
    MIN: `Минимальная цена — ${ADMIN_CONFIG.CATALOG.PRICE_MIN}`,
    MAX: `Максимальная цена — ${ADMIN_CONFIG.CATALOG.PRICE_MAX}`,
  },
  IMAGE_URL_VALIDATION: {
    TYPE: 'Ссылка на изображение должна быть строкой',
    MAX: `Ссылка на изображение должна содержать не более ${ADMIN_CONFIG.CATALOG.IMAGE_URL_MAX_LENGTH} символов`,
  },
  IS_ACTIVE_VALIDATION: {
    TYPE: 'Флаг доступности должен быть логическим значением',
  },
  HUNGER_RESTORE_VALIDATION: {
    TYPE: 'Восстановление голода должно быть числом',
    MIN: `Минимальное восстановление голода — ${ADMIN_CONFIG.CATALOG.HUNGER_RESTORE_MIN}`,
    MAX: `Максимальное восстановление голода — ${ADMIN_CONFIG.CATALOG.HUNGER_RESTORE_MAX}`,
  },
  MOOD_BONUS_VALIDATION: {
    TYPE: 'Бонус настроения должен быть числом',
    MIN: `Минимальный бонус настроения — ${ADMIN_CONFIG.CATALOG.MOOD_BONUS_MIN}`,
    MAX: `Максимальный бонус настроения — ${ADMIN_CONFIG.CATALOG.MOOD_BONUS_MAX}`,
  },
} as const;
