import type { PaginationMeta } from '../shared/pagination.types.js';

export interface FoodEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  hungerRestore: number;
  moodBonus: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodInventoryEntity {
  id: string;
  quantity: number;
  food: FoodEntity;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuyFoodInput {
  foodId: string;
  quantity: number;
}

export interface FoodPurchaseEntity {
  inventory: FoodInventoryEntity;
  spentCoins: string;
  coinsBalance: string;
}

export interface PaginatedFoodsOutput {
  pagination: PaginationMeta;
  foods: FoodEntity[];
}
