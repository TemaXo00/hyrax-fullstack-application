import { Module } from '@nestjs/common';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

import { CosmeticShopController } from './shop/cosmetic-shop.controller';
import { CosmeticShopService } from './shop/cosmetic-shop.service';
import { FoodShopController } from './shop/food-shop.controller';
import { FoodShopService } from './shop/food-shop.service';
import { UpgradeShopController } from './shop/upgrade-shop.controller';
import { UpgradeShopService } from './shop/upgrade-shop.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [
    FoodShopController,
    CosmeticShopController,
    UpgradeShopController,
  ],
  providers: [FoodShopService, CosmeticShopService, UpgradeShopService],
})
export class ShopFeatureModule {}
