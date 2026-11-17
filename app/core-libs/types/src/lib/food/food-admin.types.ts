import type { FoodEntity, PaginatedFoodsOutput } from './food.types.js';
import type { PaginationInput } from '../shared/pagination.types.js';

export interface CreateFoodAdminInput {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive?: boolean;
  hungerRestore: number;
  moodBonus: number;
}

export interface UpdateFoodAdminInput {
  name?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  hungerRestore?: number;
  moodBonus?: number;
}

export interface FoodAdminServiceContract {
  getFoods(pagination: PaginationInput): Promise<PaginatedFoodsOutput>;
  getFoodById(foodId: string): Promise<FoodEntity>;
  createFood(input: CreateFoodAdminInput): Promise<FoodEntity>;
  updateFood(foodId: string, input: UpdateFoodAdminInput): Promise<FoodEntity>;
  deleteFood(foodId: string): Promise<void>;
}
