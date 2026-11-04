import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AuthJwtPayload } from '@org/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('HYRAX_JWT_SECRET'),
    });
  }

  validate(payload: AuthJwtPayload): AuthJwtPayload {
    return {
      id: payload.id,
      sessionId: payload.sessionId,
      role: payload.role,
    };
  }
}
