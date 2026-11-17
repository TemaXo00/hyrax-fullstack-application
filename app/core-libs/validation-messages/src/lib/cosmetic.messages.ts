import { COSMETIC_RARITY_OPTIONS, COSMETIC_SLOT_OPTIONS } from '@org/types';
import { ADMIN_CONFIG } from '@org/validation-config';

export const COSMETIC_MESSAGES = {
  NOT_FOUND: 'Косметика не найдена',
  INACTIVE: 'Эта косметика недоступна для покупки',
  ALREADY_OWNED: 'Эта косметика уже есть в инвентаре',
  NOT_OWNED: 'Этой косметики нет в инвентаре',
  DELETE_CONFLICT:
    'Нельзя удалить косметику, пока она есть в инвентаре игроков или используется в ежедневных наградах',
  EQUIPPED_VALIDATION: {
    TYPE: 'Флаг экипировки должен быть логическим значением',
  },
  NAME_VALIDATION: {
    NOT_EMPTY: 'Название косметики не должно быть пустым',
    TYPE: 'Название косметики должно быть строкой',
    LENGTH: `Название косметики должно содержать от ${ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH} до ${ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH} символов`,
  },
  DESCRIPTION_VALIDATION: {
    TYPE: 'Описание косметики должно быть строкой',
    MAX: `Описание косметики должно содержать не более ${ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH} символов`,
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
  SLOT_VALIDATION: {
    NOT_EMPTY: 'Слот экипировки не должен быть пустым',
    INVALID: `Недопустимый слот экипировки. Доступные варианты: ${COSMETIC_SLOT_OPTIONS}`,
  },
  RARITY_VALIDATION: {
    NOT_EMPTY: 'Редкость не должна быть пустой',
    INVALID: `Недопустимая редкость. Доступные варианты: ${COSMETIC_RARITY_OPTIONS}`,
  },
} as const;
