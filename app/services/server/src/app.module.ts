import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthAdminFeatureModule } from '@org/auth-admin-feature';
import { AuthCoreModule } from '@org/auth-core';
import { AuthFeatureModule } from '@org/auth-feature';
import { AuthSessionFeatureModule } from '@org/auth-session-feature';
import { DatabaseModule } from '@org/database';
import { PetFeatureModule } from '@org/pet-feature';
import { RedisModule } from '@org/redis';
import { GAME_CONFIG } from '@org/validation-config';
import { THROTTLE_MESSAGES } from '@org/validation-messages';

import { AppThrottlerGuard } from './app-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const windowMinutes = Number(
          config.get<string | number>('HYRAX_SERVER_WINDOW_MS_MINUTES', 15),
        );
        const requestLimit = Number(
          config.get<string | number>(
            'HYRAX_SERVER_REQUEST_LIMIT',
            GAME_CONFIG.THROTTLE.DEFAULT_LIMIT,
          ),
        );

        return {
          throttlers: [
            {
              name: 'default',
              ttl:
                (Number.isFinite(windowMinutes) && windowMinutes > 0
                  ? windowMinutes
                  : GAME_CONFIG.THROTTLE.DEFAULT_TTL_MS / 60_000) * 60_000,
              limit:
                Number.isFinite(requestLimit) && requestLimit > 0
                  ? requestLimit
                  : GAME_CONFIG.THROTTLE.DEFAULT_LIMIT,
            },
          ],
          errorMessage: THROTTLE_MESSAGES.EXCEEDED,
        };
      },
    }),
    RedisModule,
    DatabaseModule,
    AuthCoreModule,
    AuthFeatureModule,
    AuthSessionFeatureModule,
    AuthAdminFeatureModule,
    PetFeatureModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
