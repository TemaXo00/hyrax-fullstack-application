import { USER_ROLE_OPTIONS } from '@org/types';
import { AUTH_CONFIG } from '@org/validation-config';

export const AUTH_ADMIN_MESSAGES = {
  USER_NOT_FOUND: 'Пользователь не найден',
  CANNOT_BLOCK_SELF: 'Нельзя заблокировать собственный аккаунт',
  USER_ALREADY_BLOCKED: 'Пользователь уже заблокирован',
  USER_NOT_BLOCKED: 'Пользователь не заблокирован',
  INVALID_BLOCK_DATE: 'Некорректная дата блокировки',
  BLOCK_PREVIOUS_DATE: 'Дата блокировки должна быть позже текущей даты',
  BLOCK_TOO_FAR: `Дата блокировки слишком далеко в будущем. Максимальная длительность блокировки — ${AUTH_CONFIG.BLOCK.MAX_DATE_YEAR} лет`,
  ROLE_VALIDATION: {
    NOT_EMPTY: 'Роль не должна быть пустой',
    INVALID: `Недопустимая роль. Доступные варианты: ${USER_ROLE_OPTIONS}`,
  },
  BLOCK_REASON_VALIDATION: {
    NOT_EMPTY: 'Причина блокировки не должна быть пустой',
    TYPE: 'Причина блокировки должна быть строкой',
    LENGTH: `Причина блокировки должна содержать от ${AUTH_CONFIG.BLOCK_REASON.MIN_LENGTH} до ${AUTH_CONFIG.BLOCK_REASON.MAX_LENGTH} символов`,
  },
  BLOCKED_UNTIL_VALIDATION: {
    NOT_EMPTY: 'Дата блокировки не должна быть пустой',
    TYPE: 'Дата блокировки должна быть в формате даты и времени. Пример: 2026-09-26T09:00:00.000Z',
    DATE: 'Минимальная дата блокировки должна быть позже текущей даты',
  },
} as const;
