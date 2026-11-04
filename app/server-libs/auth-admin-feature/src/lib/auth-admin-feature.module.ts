import { Module } from '@nestjs/common';
import { AuthCoreModule } from '@org/auth-core';

import { AuthAdminFeatureController } from './auth-admin-feature.controller';
import { AuthAdminFeatureService } from './auth-admin-feature.service';

@Module({
  imports: [AuthCoreModule],
  controllers: [AuthAdminFeatureController],
  providers: [AuthAdminFeatureService],
})
export class AuthAdminFeatureModule {}
