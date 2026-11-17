import type {
  CosmeticEntity,
  CosmeticRarity,
  CosmeticSlot,
  PaginatedCosmeticsOutput,
} from './cosmetic.types.js';
import type { PaginationInput } from '../shared/pagination.types.js';

export interface CreateCosmeticAdminInput {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive?: boolean;
  slot: CosmeticSlot;
  rarity: CosmeticRarity;
}

export interface UpdateCosmeticAdminInput {
  name?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  slot?: CosmeticSlot;
  rarity?: CosmeticRarity;
}

export interface CosmeticAdminServiceContract {
  getCosmetics(pagination: PaginationInput): Promise<PaginatedCosmeticsOutput>;
  getCosmeticById(cosmeticId: string): Promise<CosmeticEntity>;
  createCosmetic(input: CreateCosmeticAdminInput): Promise<CosmeticEntity>;
  updateCosmetic(
    cosmeticId: string,
    input: UpdateCosmeticAdminInput,
  ): Promise<CosmeticEntity>;
  deleteCosmetic(cosmeticId: string): Promise<void>;
}
