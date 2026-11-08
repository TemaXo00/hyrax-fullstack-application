import type {
  FeedPetInput,
  PetActionResultEntity,
  PetEntity,
  PetStateEntity,
  RenamePetInput,
} from './pet.types.js';
import type {
  CosmeticInventoryEntity,
  CosmeticPurchaseEntity,
  EquipCosmeticInput,
  PaginatedCosmeticsOutput,
} from '../cosmetic/cosmetic.types.js';
import type {
  BuyFoodInput,
  FoodPurchaseEntity,
  PaginatedFoodsOutput,
} from '../food/food.types.js';
import type { PaginationInput } from '../shared/pagination.types.js';
import type {
  BuyUpgradeInput,
  PaginatedUpgradesOutput,
  UpgradePurchaseEntity,
} from '../upgrade/upgrade.types.js';

export interface PetServiceContract {
  getState(userId: string): Promise<PetStateEntity>;
  rename(userId: string, input: RenamePetInput): Promise<PetEntity>;
  feed(userId: string, input: FeedPetInput): Promise<PetActionResultEntity>;
  click(userId: string): Promise<PetActionResultEntity>;
  walk(userId: string): Promise<PetActionResultEntity>;
}

export interface FoodShopServiceContract {
  getFoods(pagination: PaginationInput): Promise<PaginatedFoodsOutput>;
  buyFood(userId: string, input: BuyFoodInput): Promise<FoodPurchaseEntity>;
}

export interface CosmeticShopServiceContract {
  getCosmetics(pagination: PaginationInput): Promise<PaginatedCosmeticsOutput>;
  buyCosmetic(
    userId: string,
    cosmeticId: string,
  ): Promise<CosmeticPurchaseEntity>;
  equipCosmetic(
    userId: string,
    cosmeticId: string,
    input: EquipCosmeticInput,
  ): Promise<CosmeticInventoryEntity>;
}

export interface UpgradeShopServiceContract {
  getUpgrades(
    userId: string,
    pagination: PaginationInput,
  ): Promise<PaginatedUpgradesOutput>;
  buyUpgrade(
    userId: string,
    input: BuyUpgradeInput,
  ): Promise<UpgradePurchaseEntity>;
}
