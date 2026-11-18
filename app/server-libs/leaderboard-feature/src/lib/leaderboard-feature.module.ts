import { Module } from '@nestjs/common';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

import { LeaderboardFeatureController } from './leaderboard-feature.controller';
import { LeaderboardFeatureService } from './leaderboard-feature.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [LeaderboardFeatureController],
  providers: [LeaderboardFeatureService],
})
export class LeaderboardFeatureModule {}
