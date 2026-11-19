import type { Serialized } from './types';
import type { CosmeticEntity, FoodEntity, UpgradeShopEntity } from '@org/types';

export type Food = Serialized<FoodEntity>;
export type Cosmetic = Serialized<CosmeticEntity>;
export type UpgradeShop = Serialized<UpgradeShopEntity>;
