import { PartialType } from '@nestjs/swagger';

import {
  CosmeticAdminDescription,
  CosmeticAdminImageUrl,
  CosmeticAdminIsActive,
  CosmeticAdminName,
  CosmeticAdminPrice,
  CosmeticAdminRarity,
  CosmeticAdminSlot,
} from '../decorators/cosmetic/cosmetic-admin.decorators';

import type {
  CosmeticRarity,
  CosmeticSlot,
  CreateCosmeticAdminInput,
  UpdateCosmeticAdminInput,
} from '@org/types';

export class CreateCosmeticAdminDto implements CreateCosmeticAdminInput {
  @CosmeticAdminName()
  name: string;

  @CosmeticAdminDescription()
  description?: string | null;

  @CosmeticAdminPrice()
  price: number;

  @CosmeticAdminImageUrl()
  imageUrl?: string | null;

  @CosmeticAdminIsActive()
  isActive?: boolean;

  @CosmeticAdminSlot()
  slot: CosmeticSlot;

  @CosmeticAdminRarity()
  rarity: CosmeticRarity;
}

export class UpdateCosmeticAdminDto
  extends PartialType(CreateCosmeticAdminDto)
  implements UpdateCosmeticAdminInput {}
