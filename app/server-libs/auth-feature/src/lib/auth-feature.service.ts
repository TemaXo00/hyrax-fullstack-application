import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthPasswordService,
  AuthSessionService,
  AuthTokenService,
} from '@org/auth-core';
import { DatabaseService } from '@org/database';
import {
  mapCosmeticInventory,
  mapFoodInventory,
  mapPet,
  mapPlayerStatistic,
  mapUserAchievement,
  mapUserUpgrade,
} from '@org/pet-feature';
import { CACHE_KEYS, RedisService } from '@org/redis';
import { getUserRoleLabel } from '@org/types';
import { AUTH_CONFIG } from '@org/validation-config';
import { AUTH_MESSAGES } from '@org/validation-messages';

import type { Prisma, User } from '@org/database';
import type {
  AuthSessionResult,
  AuthServiceContract,
  ChangePasswordInput,
  ClientMeta,
  LoginInput,
  MeEntity,
  RegisterInput,
  UserEntity,
} from '@org/types';

const ME_INCLUDE = {
  pet: true,
  stats: true,
  streak: true,
  foodInventories: {
    include: { food: true },
    orderBy: { createdAt: 'asc' },
  },
  cosmeticInventories: {
    include: { cosmetic: true },
    orderBy: { createdAt: 'asc' },
  },
  userUpgrades: {
    include: { upgrade: true },
    orderBy: { createdAt: 'asc' },
  },
  userAchievments: {
    include: { achievment: true },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.UserInclude;

type MeUserView = Prisma.UserGetPayload<{ include: typeof ME_INCLUDE }>;

@Injectable()
export class AuthFeatureService implements AuthServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly password: AuthPasswordService,
    private readonly token: AuthTokenService,
    private readonly session: AuthSessionService,
    private readonly redis: RedisService,
  ) {}

  async register(
    input: RegisterInput,
    meta: ClientMeta,
  ): Promise<AuthSessionResult> {
    const existingUser = await this.db.user.findUnique({
      where: { nickname: input.nickname },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(AUTH_MESSAGES.USER_WITH_NICKNAME_EXISTS);
    }

    this.password.validateConfirmation(
      input.password,
      input.passwordConfirmation,
    );

    const passwordHash = await this.password.hash(input.password);
    const user = await this.db.user.create({
      data: {
        nickname: input.nickname,
        passwordHash,
        pet: {
          create: {
            name: this.buildPetName(input.nickname),
            updatedAt: new Date(),
          },
        },
        stats: {
          create: {},
        },
      },
    });

    await this.redis.delByPrefix(CACHE_KEYS.adminUsersPrefix());

    return await this.createSession(user, meta);
  }

  async login(input: LoginInput, meta: ClientMeta): Promise<AuthSessionResult> {
    const existingUser = await this.db.user.findUnique({
      where: { nickname: input.nickname },
    });

    if (!existingUser) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const user = await this.ensureUserNotBlocked(existingUser);

    const isPasswordValid = await this.password.verify(
      user.passwordHash,
      input.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const updatedUser = await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.invalidateUserCaches(user.id);

    return await this.createSession(updatedUser, meta);
  }

  async refresh(
    refreshToken: string,
    _meta: ClientMeta,
  ): Promise<AuthSessionResult> {
    const payload = this.token.verifyRefreshToken(refreshToken);
    const session = await this.session.findById(payload.sessionId);

    if (!session || session.userId !== payload.id) {
      throw new UnauthorizedException(AUTH_MESSAGES.SESSION_NOT_FOUND);
    }

    await this.token.verifyTokenHash(session.refreshTokenHash, refreshToken);

    const existingUser = await this.db.user.findUnique({
      where: { id: payload.id },
    });

    if (!existingUser) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const user = await this.ensureUserNotBlocked(existingUser);
    const tokens = this.token.generateTokens({
      id: user.id,
      sessionId: payload.sessionId,
      role: user.role,
    });
    const refreshTokenHash = await this.token.hashToken(tokens.refreshToken);

    await this.session.rotate(payload.sessionId, refreshTokenHash);

    return {
      ...tokens,
      user: this.mapUser(user),
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = this.token.verifyRefreshToken(refreshToken);
      await this.session.delete(payload.sessionId, payload.id);
    } catch {
      return;
    }
  }

  async me(userId: string): Promise<MeEntity> {
    return await this.redis.getOrSet(CACHE_KEYS.me(userId), async () => {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: ME_INCLUDE,
      });

      if (!user) {
        throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
      }

      return this.mapMe(user);
    });
  }

  async changePassword(
    userId: string,
    sessionId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    await this.password.verifyOrThrow(user.passwordHash, input.oldPassword);
    this.password.validateConfirmation(
      input.newPassword,
      input.newPasswordConfirmation,
    );
    this.password.validateNewPassword(input.oldPassword, input.newPassword);

    const passwordHash = await this.password.hash(input.newPassword);

    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.session.deleteAllForUser(userId, sessionId);
    await this.invalidateUserCaches(userId);
  }

  private async createSession(
    user: User,
    meta: ClientMeta,
  ): Promise<AuthSessionResult> {
    const sessionId = randomUUID();
    const tokens = this.token.generateTokens({
      id: user.id,
      sessionId,
      role: user.role,
    });
    const refreshTokenHash = await this.token.hashToken(tokens.refreshToken);

    await this.session.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      meta,
    });

    return {
      ...tokens,
      user: this.mapUser(user),
    };
  }

  private async ensureUserNotBlocked(user: User): Promise<User> {
    if (!user.isBlocked) {
      return user;
    }

    if (user.blockedUntil && user.blockedUntil <= new Date()) {
      return await this.db.user.update({
        where: { id: user.id },
        data: {
          isBlocked: false,
          blockedUntil: null,
          blockReason: null,
        },
      });
    }

    const message = user.blockedUntil
      ? AUTH_MESSAGES.USER_BLOCKED(user.blockedUntil, user.blockReason ?? '')
      : AUTH_MESSAGES.USER_BLOCKED_FOREVER(user.blockReason ?? '');

    throw new ForbiddenException(message);
  }

  private buildPetName(nickname: string): string {
    return `Питомец ${nickname}`.slice(0, AUTH_CONFIG.PET_NAME.MAX_LENGTH);
  }

  private async invalidateUserCaches(userId: string): Promise<void> {
    await Promise.all([
      this.redis.del(CACHE_KEYS.me(userId), CACHE_KEYS.adminUser(userId)),
      this.redis.delByPrefix(CACHE_KEYS.adminUsersPrefix()),
    ]);
  }

  private mapMe(user: MeUserView): MeEntity {
    return {
      ...this.mapUser(user),
      pet: user.pet ? mapPet(user.pet) : null,
      stats: user.stats ? mapPlayerStatistic(user.stats) : null,
      streak: user.streak
        ? {
            id: user.streak.id,
            currentStreak: user.streak.currentStreak,
            bestStreak: user.streak.bestStreak,
            lastClaimDate: user.streak.lastClaimDate,
            createdAt: user.streak.createdAt,
            updatedAt: user.streak.updatedAt,
          }
        : null,
      foodInventory: user.foodInventories.map(mapFoodInventory),
      cosmeticInventory: user.cosmeticInventories.map(mapCosmeticInventory),
      upgrades: user.userUpgrades.map(mapUserUpgrade),
      achievements: user.userAchievments.map(mapUserAchievement),
    };
  }

  private mapUser(user: User): UserEntity {
    return {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      roleLabel: getUserRoleLabel(user.role),
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil,
      blockReason: user.blockReason,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
