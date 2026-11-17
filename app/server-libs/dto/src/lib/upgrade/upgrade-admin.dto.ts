import { PartialType } from '@nestjs/swagger';

import {
  UpgradeAdminBasePrice,
  UpgradeAdminDescription,
  UpgradeAdminEffectType,
  UpgradeAdminEffectValue,
  UpgradeAdminImageUrl,
  UpgradeAdminMaxLevel,
  UpgradeAdminName,
  UpgradeAdminPriceMultiplier,
} from '../decorators/upgrade/upgrade-admin.decorators';

import type {
  CreateUpgradeAdminInput,
  UpdateUpgradeAdminInput,
  UpgradeEffectType,
} from '@org/types';

export class CreateUpgradeAdminDto implements CreateUpgradeAdminInput {
  @UpgradeAdminName()
  name: string;

  @UpgradeAdminDescription()
  description?: string | null;

  @UpgradeAdminImageUrl()
  imageUrl?: string | null;

  @UpgradeAdminEffectType()
  effectType: UpgradeEffectType;

  @UpgradeAdminEffectValue()
  effectValue: number;

  @UpgradeAdminBasePrice()
  basePrice: number;

  @UpgradeAdminPriceMultiplier()
  priceMultiplier: number;

  @UpgradeAdminMaxLevel()
  maxLevel: number;
}

export class UpdateUpgradeAdminDto
  extends PartialType(CreateUpgradeAdminDto)
  implements UpdateUpgradeAdminInput {}
