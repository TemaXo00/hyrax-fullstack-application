import { UPGRADE_EFFECT_OPTIONS } from '@org/types';
import { ADMIN_CONFIG } from '@org/validation-config';

export const UPGRADE_MESSAGES = {
  NOT_FOUND: 'Улучшение не найдено',
  MAX_LEVEL_REACHED: 'Улучшение уже имеет максимальный уровень',
  MAX_LEVEL_REACHED_WITH_VALUE: (level: number): string =>
    `Улучшение уже имеет максимальный уровень ${level}`,
  DELETE_CONFLICT:
    'Нельзя удалить улучшение, пока оно куплено хотя бы одним игроком',
  NAME_VALIDATION: {
    NOT_EMPTY: 'Название улучшения не должно быть пустым',
    TYPE: 'Название улучшения должно быть строкой',
    LENGTH: `Название улучшения должно содержать от ${ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH} до ${ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH} символов`,
  },
  DESCRIPTION_VALIDATION: {
    TYPE: 'Описание улучшения должно быть строкой',
    MAX: `Описание улучшения должно содержать не более ${ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH} символов`,
  },
  IMAGE_URL_VALIDATION: {
    TYPE: 'Ссылка на изображение должна быть строкой',
    MAX: `Ссылка на изображение должна содержать не более ${ADMIN_CONFIG.CATALOG.IMAGE_URL_MAX_LENGTH} символов`,
  },
  EFFECT_TYPE_VALIDATION: {
    NOT_EMPTY: 'Тип эффекта не должен быть пустым',
    INVALID: `Недопустимый тип эффекта. Доступные варианты: ${UPGRADE_EFFECT_OPTIONS}`,
  },
  EFFECT_VALUE_VALIDATION: {
    TYPE: 'Значение эффекта должно быть числом',
    MIN: `Минимальное значение эффекта — ${ADMIN_CONFIG.CATALOG.EFFECT_VALUE_MIN}`,
    MAX: `Максимальное значение эффекта — ${ADMIN_CONFIG.CATALOG.EFFECT_VALUE_MAX}`,
  },
  BASE_PRICE_VALIDATION: {
    TYPE: 'Базовая цена должна быть числом',
    MIN: `Минимальная базовая цена — ${ADMIN_CONFIG.CATALOG.PRICE_MIN}`,
    MAX: `Максимальная базовая цена — ${ADMIN_CONFIG.CATALOG.PRICE_MAX}`,
  },
  PRICE_MULTIPLIER_VALIDATION: {
    TYPE: 'Множитель цены должен быть числом',
    MIN: `Минимальный множитель цены — ${ADMIN_CONFIG.CATALOG.PRICE_MULTIPLIER_MIN}`,
    MAX: `Максимальный множитель цены — ${ADMIN_CONFIG.CATALOG.PRICE_MULTIPLIER_MAX}`,
  },
  MAX_LEVEL_VALIDATION: {
    TYPE: 'Максимальный уровень должен быть числом',
    MIN: `Минимальный максимальный уровень — ${ADMIN_CONFIG.CATALOG.MAX_LEVEL_MIN}`,
    MAX: `Максимальный уровень — ${ADMIN_CONFIG.CATALOG.MAX_LEVEL_MAX}`,
  },
} as const;
