import {
  COSMETIC_SHOP_ROUTES,
  FOOD_SHOP_ROUTES,
  UPGRADE_SHOP_ROUTES,
} from '@org/types';

import { request } from './http';

import type { PaginationInput, Serialized } from './types';
import type {
  CosmeticInventoryEntity,
  CosmeticPurchaseEntity,
  FoodPurchaseEntity,
  PaginatedCosmeticsOutput,
  PaginatedFoodsOutput,
  PaginatedUpgradesOutput,
  UpgradePurchaseEntity,
} from '@org/types';

export type PaginatedFoods = Serialized<PaginatedFoodsOutput>;
export type PaginatedCosmetics = Serialized<PaginatedCosmeticsOutput>;
export type PaginatedUpgrades = Serialized<PaginatedUpgradesOutput>;
export type FoodPurchase = Serialized<FoodPurchaseEntity>;
export type CosmeticPurchase = Serialized<CosmeticPurchaseEntity>;
export type CosmeticInventory = Serialized<CosmeticInventoryEntity>;
export type UpgradePurchase = Serialized<UpgradePurchaseEntity>;

export async function getFoods(
  pagination: PaginationInput = {},
): Promise<PaginatedFoods> {
  return await request<PaginatedFoods>({
    url: `/${FOOD_SHOP_ROUTES.BASE}`,
    method: 'QUERY',
    data: pagination,
  });
}

export async function buyFood(
  foodId: string,
  quantity = 1,
): Promise<FoodPurchase> {
  return await request<FoodPurchase>({
    url: `/${FOOD_SHOP_ROUTES.BASE}/${foodId}/buy`,
    method: 'POST',
    data: { quantity },
  });
}

export async function getCosmetics(
  pagination: PaginationInput = {},
): Promise<PaginatedCosmetics> {
  return await request<PaginatedCosmetics>({
    url: `/${COSMETIC_SHOP_ROUTES.BASE}`,
    method: 'QUERY',
    data: pagination,
  });
}

export async function buyCosmetic(
  cosmeticId: string,
): Promise<CosmeticPurchase> {
  return await request<CosmeticPurchase>({
    url: `/${COSMETIC_SHOP_ROUTES.BASE}/${cosmeticId}/buy`,
    method: 'POST',
  });
}

export async function equipCosmetic(
  cosmeticId: string,
  equipped: boolean,
): Promise<CosmeticInventory> {
  return await request<CosmeticInventory>({
    url: `/${COSMETIC_SHOP_ROUTES.BASE}/${cosmeticId}/equip`,
    method: 'PATCH',
    data: { equipped },
  });
}

export async function getUpgrades(
  pagination: PaginationInput = {},
): Promise<PaginatedUpgrades> {
  return await request<PaginatedUpgrades>({
    url: `/${UPGRADE_SHOP_ROUTES.BASE}`,
    method: 'QUERY',
    data: pagination,
  });
}

export async function buyUpgrade(
  upgradeId: string,
): Promise<UpgradePurchase> {
  return await request<UpgradePurchase>({
    url: `/${UPGRADE_SHOP_ROUTES.BASE}/${upgradeId}/buy`,
    method: 'POST',
  });
}
