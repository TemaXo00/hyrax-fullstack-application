export const SHOP_MESSAGES = {
  INSUFFICIENT_COINS: (required: number, balance: string): string =>
    `Недостаточно монет. Требуется ${required}, на балансе ${balance}`,
  ID_VALIDATION: {
    NOT_EMPTY: 'Идентификатор не должен быть пустым',
    TYPE: 'Идентификатор должен быть строкой',
  },
} as const;
