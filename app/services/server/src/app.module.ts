import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAdminFeatureModule } from '@org/auth-admin-feature';
import { AuthCoreModule } from '@org/auth-core';
import { AuthFeatureModule } from '@org/auth-feature';
import { AuthSessionFeatureModule } from '@org/auth-session-feature';
import { DatabaseModule } from '@org/database';
import { RedisModule } from '@org/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    DatabaseModule,
    AuthCoreModule,
    AuthFeatureModule,
    AuthSessionFeatureModule,
    AuthAdminFeatureModule,
  ],
})
export class AppModule {}
