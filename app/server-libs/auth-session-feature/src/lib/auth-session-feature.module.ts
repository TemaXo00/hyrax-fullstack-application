import { Module } from '@nestjs/common';
import { AuthCoreModule } from '@org/auth-core';

import { AuthSessionFeatureController } from './auth-session-feature.controller';
import { AuthSessionFeatureService } from './auth-session-feature.service';

@Module({
  imports: [AuthCoreModule],
  controllers: [AuthSessionFeatureController],
  providers: [AuthSessionFeatureService],
})
export class AuthSessionFeatureModule {}
