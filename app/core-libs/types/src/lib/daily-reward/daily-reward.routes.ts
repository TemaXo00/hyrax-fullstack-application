export const DAILY_REWARD_ROUTES = {
  BASE: 'daily-rewards',
  STATE: '',
  CLAIM: 'claim',
} as const;

export const DAILY_REWARD_ADMIN_ROUTES = {
  BASE: 'admin/daily-rewards',
  LIST: '',
  ITEM: ':dayNumber',
} as const;
