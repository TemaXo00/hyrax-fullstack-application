export const AUTH_CONFIG = {
  NICKNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 70,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MIN_LOWERCASE: 1,
    MIN_UPPERCASE: 1,
    MIN_NUMBERS: 1,
    MIN_SYMBOLS: 0,
  },
  BLOCK_REASON: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 800,
  },
  LOCAL_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 90,
  },
  PET_NAME: {
    MAX_LENGTH: 70,
  },
  BLOCK: {
    MAX_DATE_YEAR: 10,
  },
  TOKEN: {
    ACCESS_TTL_MINUTES: 15,
    REFRESH_TTL_DAYS: 30,
  },
} as const;
