import { GAME_CONFIG } from '@org/validation-config';

export const FOOD_MESSAGES = {
  NOT_FOUND: 'Еда не найдена',
  INACTIVE: 'Эта еда недоступна для покупки',
  NOT_IN_INVENTORY: 'В инвентаре нет выбранной еды',
  QUANTITY_VALIDATION: {
    TYPE: 'Количество должно быть числом',
    MIN: `Минимальное количество — ${GAME_CONFIG.FOOD.QUANTITY_MIN}`,
    MAX: `Максимальное количество — ${GAME_CONFIG.FOOD.QUANTITY_MAX}`,
  },
} as const;
