import { Module } from '@nestjs/common';
import { AuthCoreModule } from '@org/auth-core';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

import { PetFeatureController } from './pet-feature.controller';
import { PetFeatureService } from './pet-feature.service';

@Module({
  imports: [DatabaseModule, RedisModule, AuthCoreModule],
  controllers: [PetFeatureController],
  providers: [PetFeatureService],
  exports: [PetFeatureService],
})
export class PetFeatureModule {}
