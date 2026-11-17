import { Module } from '@nestjs/common';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

import { CosmeticAdminController } from './cosmetic-admin.controller';
import { CosmeticAdminService } from './cosmetic-admin.service';
import { FoodAdminController } from './food-admin.controller';
import { FoodAdminService } from './food-admin.service';
import { UpgradeAdminController } from './upgrade-admin.controller';
import { UpgradeAdminService } from './upgrade-admin.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [
    FoodAdminController,
    CosmeticAdminController,
    UpgradeAdminController,
  ],
  providers: [FoodAdminService, CosmeticAdminService, UpgradeAdminService],
})
export class ShopAdminFeatureModule {}
