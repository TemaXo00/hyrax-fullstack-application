import { Module } from '@nestjs/common';
import { AuthCoreModule } from '@org/auth-core';

import { AuthFeatureController } from './auth-feature.controller';
import { AuthFeatureService } from './auth-feature.service';

@Module({
  imports: [AuthCoreModule],
  controllers: [AuthFeatureController],
  providers: [AuthFeatureService],
})
export class AuthFeatureModule {}
