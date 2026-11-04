import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';

import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single' as const,
        url: config.get<string>('HYRAX_REDIS_URL', 'redis://localhost:6379'),
        options: {
          password: config.get<string>('HYRAX_REDIS_PASSWORD'),
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
        },
      }),
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
