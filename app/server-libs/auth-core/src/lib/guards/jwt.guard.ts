import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DatabaseService } from '@org/database';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { AUTH_MESSAGES } from '@org/validation-messages';

import type { AuthJwtPayload, AuthenticatedUser } from '@org/types';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { user?: AuthJwtPayload };

@Injectable()
export class AuthJwtGuard extends AuthGuard('jwt') {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const payload = request.user;

    if (!payload) {
      throw new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    const cacheKey = CACHE_KEYS.authSession(payload.id, payload.sessionId);
    const cachedUser = await this.redis.get<AuthenticatedUser>(cacheKey);

    if (cachedUser) {
      request.user = cachedUser;

      return true;
    }

    const user = await this.db.user.findUnique({
      where: { id: payload.id },
      include: {
        sessions: {
          where: { id: payload.sessionId },
          take: 1,
        },
      },
    });

    if (!user || user.sessions.length === 0) {
      await this.redis.del(cacheKey);

      throw new UnauthorizedException(AUTH_MESSAGES.SESSION_NOT_FOUND);
    }

    let isBlocked = user.isBlocked;

    if (isBlocked) {
      if (user.blockedUntil && user.blockedUntil <= new Date()) {
        await this.db.user.update({
          where: { id: user.id },
          data: {
            isBlocked: false,
            blockedUntil: null,
            blockReason: null,
          },
        });
        isBlocked = false;

        await Promise.all([
          this.redis.del(CACHE_KEYS.me(user.id), CACHE_KEYS.adminUser(user.id)),
          this.redis.delByPrefix(CACHE_KEYS.adminUsersPrefix()),
        ]);
      } else {
        const message = user.blockedUntil
          ? AUTH_MESSAGES.USER_BLOCKED(
              user.blockedUntil,
              user.blockReason ?? '',
            )
          : AUTH_MESSAGES.USER_BLOCKED_FOREVER(user.blockReason ?? '');

        await this.redis.del(cacheKey);

        throw new ForbiddenException(message);
      }
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      sessionId: payload.sessionId,
      role: user.role,
      nickname: user.nickname,
      isBlocked,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    await this.redis.set(cacheKey, authenticatedUser);

    request.user = authenticatedUser;

    return true;
  }
}
