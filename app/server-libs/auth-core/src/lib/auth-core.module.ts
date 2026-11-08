import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '@org/database';

import { AuthJwtGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthWsGuard } from './guards/ws-auth.guard';
import { AuthCookieService } from './services/cookie.service';
import { AuthPasswordService } from './services/password.service';
import { AuthSessionValidatorService } from './services/session-validator.service';
import { AuthSessionService } from './services/session.service';
import { AuthTokenService } from './services/token.service';
import { AuthWsService } from './services/ws-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

const AUTH_PROVIDERS = [
  JwtStrategy,
  AuthJwtGuard,
  AuthWsGuard,
  RolesGuard,
  AuthCookieService,
  AuthPasswordService,
  AuthSessionService,
  AuthSessionValidatorService,
  AuthTokenService,
  AuthWsService,
];

@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('HYRAX_JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
        },
        verifyOptions: {
          algorithms: ['HS256'],
          ignoreExpiration: false,
        },
      }),
    }),
  ],
  providers: [...AUTH_PROVIDERS],
  exports: [...AUTH_PROVIDERS, JwtModule],
})
export class AuthCoreModule {}
