import { Module } from '@nestjs/common';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

import { DailyRewardAdminController } from './daily-reward-admin.controller';
import { DailyRewardAdminService } from './daily-reward-admin.service';
import { DailyRewardFeatureController } from './daily-reward-feature.controller';
import { DailyRewardFeatureService } from './daily-reward-feature.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [DailyRewardFeatureController, DailyRewardAdminController],
  providers: [DailyRewardFeatureService, DailyRewardAdminService],
})
export class DailyRewardFeatureModule {}
