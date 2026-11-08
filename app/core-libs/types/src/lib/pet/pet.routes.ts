export const PET_ROUTES = {
  BASE: 'pets',
  STATE: 'me',
  RENAME: 'name',
  FEED: 'feed',
  CLICK: 'click',
  WALK: 'walk',
} as const;

export const FOOD_SHOP_ROUTES = {
  BASE: 'shop/foods',
  LIST: '',
  BUY: ':id/buy',
} as const;

export const COSMETIC_SHOP_ROUTES = {
  BASE: 'shop/cosmetics',
  LIST: '',
  BUY: ':id/buy',
  EQUIP: ':id/equip',
} as const;

export const UPGRADE_SHOP_ROUTES = {
  BASE: 'shop/upgrades',
  LIST: '',
  BUY: ':id/buy',
} as const;
