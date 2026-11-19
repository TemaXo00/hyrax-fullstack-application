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
  return await request<PaginatedFoods>(`/${FOOD_SHOP_ROUTES.BASE}`, {
    method: 'QUERY',
    body: pagination,
  });
}

export async function buyFood(
  foodId: string,
  quantity = 1,
): Promise<FoodPurchase> {
  return await request<FoodPurchase>(
    `/${FOOD_SHOP_ROUTES.BASE}/${foodId}/buy`,
    { method: 'POST', body: { quantity } },
  );
}

export async function getCosmetics(
  pagination: PaginationInput = {},
): Promise<PaginatedCosmetics> {
  return await request<PaginatedCosmetics>(`/${COSMETIC_SHOP_ROUTES.BASE}`, {
    method: 'QUERY',
    body: pagination,
  });
}

export async function buyCosmetic(
  cosmeticId: string,
): Promise<CosmeticPurchase> {
  return await request<CosmeticPurchase>(
    `/${COSMETIC_SHOP_ROUTES.BASE}/${cosmeticId}/buy`,
    { method: 'POST' },
  );
}

export async function equipCosmetic(
  cosmeticId: string,
  equipped: boolean,
): Promise<CosmeticInventory> {
  return await request<CosmeticInventory>(
    `/${COSMETIC_SHOP_ROUTES.BASE}/${cosmeticId}/equip`,
    { method: 'PATCH', body: { equipped } },
  );
}

export async function getUpgrades(
  pagination: PaginationInput = {},
): Promise<PaginatedUpgrades> {
  return await request<PaginatedUpgrades>(`/${UPGRADE_SHOP_ROUTES.BASE}`, {
    method: 'QUERY',
    body: pagination,
  });
}

export async function buyUpgrade(upgradeId: string): Promise<UpgradePurchase> {
  return await request<UpgradePurchase>(
    `/${UPGRADE_SHOP_ROUTES.BASE}/${upgradeId}/buy`,
    { method: 'POST' },
  );
}
