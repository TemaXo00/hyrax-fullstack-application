import { Module } from '@nestjs/common';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

import { AchievementAdminController } from './achievement-admin.controller';
import { AchievementAdminService } from './achievement-admin.service';
import { AchievementFeatureController } from './achievement-feature.controller';
import { AchievementFeatureService } from './achievement-feature.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [AchievementFeatureController, AchievementAdminController],
  providers: [AchievementFeatureService, AchievementAdminService],
})
export class AchievementFeatureModule {}
