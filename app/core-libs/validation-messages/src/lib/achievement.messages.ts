import { ACHIEVEMENT_CONDITION_OPTIONS } from '@org/types';
import { ACHIEVEMENT_CONFIG } from '@org/validation-config';

export const ACHIEVEMENT_MESSAGES = {
  NOT_FOUND: 'Достижение не найдено',
  PLAYER_NOT_FOUND: 'Игрок не найден',
  ALREADY_CLAIMED: 'Достижение уже получено',
  NOT_UNLOCKED: 'Условия получения достижения ещё не выполнены',
  CODE_CONFLICT: 'Достижение с таким кодом уже существует',
  DELETE_CONFLICT:
    'Нельзя удалить достижение, пока оно получено хотя бы одним игроком',
  CODE_VALIDATION: {
    NOT_EMPTY: 'Код достижения не должен быть пустым',
    TYPE: 'Код достижения должен быть строкой',
    LENGTH: `Код достижения должен содержать от ${ACHIEVEMENT_CONFIG.CODE_MIN_LENGTH} до ${ACHIEVEMENT_CONFIG.CODE_MAX_LENGTH} символов`,
  },
  TITLE_VALIDATION: {
    NOT_EMPTY: 'Название достижения не должно быть пустым',
    TYPE: 'Название достижения должно быть строкой',
    LENGTH: `Название достижения должно содержать от ${ACHIEVEMENT_CONFIG.TITLE_MIN_LENGTH} до ${ACHIEVEMENT_CONFIG.TITLE_MAX_LENGTH} символов`,
  },
  DESCRIPTION_VALIDATION: {
    TYPE: 'Описание достижения должно быть строкой',
    MAX: `Описание достижения должно содержать не более ${ACHIEVEMENT_CONFIG.DESCRIPTION_MAX_LENGTH} символов`,
  },
  IMAGE_URL_VALIDATION: {
    TYPE: 'Ссылка на изображение должна быть строкой',
    MAX: `Ссылка на изображение должна содержать не более ${ACHIEVEMENT_CONFIG.IMAGE_URL_MAX_LENGTH} символов`,
  },
  CONDITION_TYPE_VALIDATION: {
    INVALID: `Недопустимый тип условия. Доступные варианты: ${ACHIEVEMENT_CONDITION_OPTIONS}`,
  },
  CONDITION_VALUE_VALIDATION: {
    TYPE: 'Значение условия должно быть числом',
    MIN: `Минимальное значение условия — ${ACHIEVEMENT_CONFIG.CONDITION_VALUE_MIN}`,
    MAX: `Максимальное значение условия — ${ACHIEVEMENT_CONFIG.CONDITION_VALUE_MAX}`,
  },
  REWARD_COINS_VALIDATION: {
    TYPE: 'Награда в монетах должна быть числом',
    MIN: `Минимальная награда — ${ACHIEVEMENT_CONFIG.REWARD_COINS_MIN}`,
    MAX: `Максимальная награда — ${ACHIEVEMENT_CONFIG.REWARD_COINS_MAX}`,
  },
} as const;
