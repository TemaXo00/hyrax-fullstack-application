import { AUTH_CONFIG } from '@org/validation-config';

export const AUTH_MESSAGES = {
  USER_NOT_FOUND: 'Пользователь не найден',
  USER_WITH_NICKNAME_EXISTS: 'Пользователь с таким никнеймом уже существует',
  INVALID_CREDENTIALS: 'Неверный никнейм или пароль',
  PASSWORDS_NOT_SIMILAR: 'Пароли не совпадают',
  SAME_PASSWORD: 'Новый пароль должен отличаться от старого пароля',
  INVALID_TOKEN: 'Недействительный токен',
  TOKEN_EXPIRED: 'Срок действия токена истёк',
  REFRESH_TOKEN_REQUIRED: 'Необходим refresh-токен',
  SESSION_NOT_FOUND: 'Сессия не найдена',
  SESSION_NOT_BELONG_TO_USER: 'Сессия не принадлежит пользователю',
  CANNOT_DELETE_CURRENT_SESSION:
    'Нельзя удалить текущую сессию. Для выхода используйте logout',
  USER_BLOCKED: (blockedUntil: Date, reason: string): string =>
    `Пользователь заблокирован до ${blockedUntil.toLocaleDateString('ru-RU')}. Причина: ${reason}`,
  USER_BLOCKED_FOREVER: (reason: string): string =>
    `Пользователь заблокирован. Причина: ${reason}`,
  UNAUTHORIZED: 'Требуется авторизация',
  ACCESS_DENIED: 'Доступ запрещён',
  NICKNAME_VALIDATION: {
    NOT_EMPTY: 'Никнейм не должен быть пустым',
    TYPE: 'Никнейм должен быть строкой',
    MIN_LENGTH: `Минимальная длина никнейма — ${AUTH_CONFIG.NICKNAME.MIN_LENGTH}`,
    MAX_LENGTH: `Максимальная длина никнейма — ${AUTH_CONFIG.NICKNAME.MAX_LENGTH}`,
  },
  PASSWORD_VALIDATION: {
    NOT_EMPTY: 'Пароль не должен быть пустым',
    TYPE: 'Пароль должен быть строкой',
    STRONG: `Пароль недостаточно надёжный. Минимальная длина: ${AUTH_CONFIG.PASSWORD.MIN_LENGTH}; минимальное количество строчных символов: ${AUTH_CONFIG.PASSWORD.MIN_LOWERCASE}; заглавных символов: ${AUTH_CONFIG.PASSWORD.MIN_UPPERCASE}; цифр: ${AUTH_CONFIG.PASSWORD.MIN_NUMBERS}; символов: ${AUTH_CONFIG.PASSWORD.MIN_SYMBOLS}`,
  },
  LOCAL_NAME_VALIDATION: {
    NOT_EMPTY: 'Название сессии не должно быть пустым',
    TYPE: 'Название сессии должно быть строкой',
    LENGTH: `Название сессии должно содержать от ${AUTH_CONFIG.LOCAL_NAME.MIN_LENGTH} до ${AUTH_CONFIG.LOCAL_NAME.MAX_LENGTH} символов`,
  },
} as const;
