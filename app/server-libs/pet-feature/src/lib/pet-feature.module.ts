import { Module } from '@nestjs/common';
import { AuthCoreModule } from '@org/auth-core';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

import { PetAdminFeatureService } from './pet-admin-feature.service';
import { PetAdminController } from './pet-admin.controller';
import { PetFeatureController } from './pet-feature.controller';
import { PetFeatureService } from './pet-feature.service';

@Module({
  imports: [DatabaseModule, RedisModule, AuthCoreModule],
  controllers: [PetFeatureController, PetAdminController],
  providers: [PetFeatureService, PetAdminFeatureService],
  exports: [PetFeatureService],
})
export class PetFeatureModule {}
