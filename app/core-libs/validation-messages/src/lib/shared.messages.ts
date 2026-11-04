import { SHARED_CONFIG } from '@org/validation-config';

export const SHARED_MESSAGES = {
  PAGINATION_LIMIT_VALIDATION: {
    TYPE: 'Лимит должен быть числом',
    MIN: 'Минимальный лимит — 1 объект',
    MAX: `Максимальный лимит — ${SHARED_CONFIG.PAGINATION.MAX_LIMIT} объектов`,
  },
  PAGINATION_PAGE_VALIDATION: {
    TYPE: 'Страница должна быть числом',
    MIN: 'Минимальная страница — 1',
  },
  PAGINATION_SEARCH_VALIDATION: {
    TYPE: 'Поисковая строка должна быть строкой',
    LENGTH: `Поисковая строка должна содержать от ${SHARED_CONFIG.SEARCH.MIN_LENGTH} до ${SHARED_CONFIG.SEARCH.MAX_LENGTH} символов`,
  },
  PAGINATION_IS_BLOCKED_VALIDATION: {
    TYPE: 'Фильтр блокировки должен быть логическим значением',
  },
} as const;
