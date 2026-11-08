import { Module } from '@nestjs/common';
import { AuthCoreModule } from '@org/auth-core';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

import { PetFeatureController } from './pet-feature.controller';
import { PetFeatureService } from './pet-feature.service';
import { PetGateway } from './pet.gateway';
import { CosmeticShopController } from './shop/cosmetic-shop.controller';
import { CosmeticShopService } from './shop/cosmetic-shop.service';
import { FoodShopController } from './shop/food-shop.controller';
import { FoodShopService } from './shop/food-shop.service';
import { UpgradeShopController } from './shop/upgrade-shop.controller';
import { UpgradeShopService } from './shop/upgrade-shop.service';

@Module({
  imports: [DatabaseModule, RedisModule, AuthCoreModule],
  controllers: [
    PetFeatureController,
    FoodShopController,
    CosmeticShopController,
    UpgradeShopController,
  ],
  providers: [
    PetFeatureService,
    PetGateway,
    FoodShopService,
    CosmeticShopService,
    UpgradeShopService,
  ],
  exports: [PetFeatureService],
})
export class PetFeatureModule {}
