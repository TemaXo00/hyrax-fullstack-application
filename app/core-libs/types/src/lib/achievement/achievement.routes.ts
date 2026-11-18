export const ACHIEVEMENT_ROUTES = {
  BASE: 'achievements',
  LIST: '',
  CLAIM: ':id/claim',
} as const;

export const ACHIEVEMENT_ADMIN_ROUTES = {
  BASE: 'admin/achievements',
  LIST: '',
  ITEM: ':id',
} as const;
