import { PartialType } from '@nestjs/swagger';

import {
  FoodAdminDescription,
  FoodAdminHungerRestore,
  FoodAdminImageUrl,
  FoodAdminIsActive,
  FoodAdminMoodBonus,
  FoodAdminName,
  FoodAdminPrice,
} from '../decorators/food/food-admin.decorators';

import type { CreateFoodAdminInput, UpdateFoodAdminInput } from '@org/types';

export class CreateFoodAdminDto implements CreateFoodAdminInput {
  @FoodAdminName()
  name: string;

  @FoodAdminDescription()
  description?: string | null;

  @FoodAdminPrice()
  price: number;

  @FoodAdminImageUrl()
  imageUrl?: string | null;

  @FoodAdminIsActive()
  isActive?: boolean;

  @FoodAdminHungerRestore()
  hungerRestore: number;

  @FoodAdminMoodBonus()
  moodBonus: number;
}

export class UpdateFoodAdminDto
  extends PartialType(CreateFoodAdminDto)
  implements UpdateFoodAdminInput {}
