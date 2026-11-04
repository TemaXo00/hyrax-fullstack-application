import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthSessionService, type SessionRecord } from '@org/auth-core';
import { DatabaseService } from '@org/database';
import { CACHE_KEYS, RedisService } from '@org/redis';
import {
  ADMIN_LOG_ACTIONS,
  getUserRoleLabel,
  type AdminLogAction,
  type AuthAdminServiceContract,
  type BlockUserInput,
  type PaginatedUsersOutput,
  type SessionEntity,
  type UserEntity,
  type UserPaginationInput,
  type UserRole,
} from '@org/types';
import { AUTH_CONFIG, SHARED_CONFIG } from '@org/validation-config';
import { AUTH_ADMIN_MESSAGES } from '@org/validation-messages';

import type { Prisma, User } from '@org/database';

type UserView = Pick<
  User,
  | 'id'
  | 'nickname'
  | 'role'
  | 'isBlocked'
  | 'blockedUntil'
  | 'blockReason'
  | 'createdAt'
  | 'lastLoginAt'
>;

const USER_VIEW_SELECT = {
  id: true,
  nickname: true,
  role: true,
  isBlocked: true,
  blockedUntil: true,
  blockReason: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

@Injectable()
export class AuthAdminFeatureService implements AuthAdminServiceContract {
  constructor(
    private readonly db: DatabaseService,
    private readonly session: AuthSessionService,
    private readonly redis: RedisService,
  ) {}

  async getUsers(
    pagination: UserPaginationInput,
  ): Promise<PaginatedUsersOutput> {
    return await this.redis.getOrSet(
      CACHE_KEYS.adminUsers(pagination),
      async () => {
        const page =
          pagination.page && pagination.page > 0
            ? pagination.page
            : SHARED_CONFIG.PAGINATION.DEFAULT_PAGE;
        const limit =
          pagination.limit && pagination.limit > 0
            ? pagination.limit
            : SHARED_CONFIG.PAGINATION.DEFAULT_LIMIT;
        const where = this.buildUserQuery(pagination);

        const [total, users] = await Promise.all([
          this.db.user.count({ where }),
          this.db.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            select: USER_VIEW_SELECT,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page * limit < total,
            hasPrev: page > 1,
            search: pagination.search,
          },
          users: users.map((user) => this.mapUser(user)),
        };
      },
    );
  }

  async getUserById(id: string): Promise<UserEntity> {
    return await this.redis.getOrSet(CACHE_KEYS.adminUser(id), async () =>
      this.mapUser(await this.findUserById(id)),
    );
  }

  async getUserSessions(id: string): Promise<SessionEntity[]> {
    await this.findUserById(id);
    const sessions = await this.session.listByUser(id);

    return sessions.map((session) => this.mapSession(session));
  }

  async revokeUserSessions(adminId: string, userId: string): Promise<void> {
    await this.findUserById(userId);
    await this.session.deleteAllForUser(userId);
    await this.createAdminLog(
      adminId,
      ADMIN_LOG_ACTIONS.USER_SESSIONS_REVOKED,
      userId,
      null,
    );
  }

  async blockUser(
    adminId: string,
    userId: string,
    input: BlockUserInput,
  ): Promise<UserEntity> {
    if (adminId === userId) {
      throw new BadRequestException(AUTH_ADMIN_MESSAGES.CANNOT_BLOCK_SELF);
    }

    const user = await this.findUserById(userId);

    if (user.isBlocked) {
      throw new BadRequestException(AUTH_ADMIN_MESSAGES.USER_ALREADY_BLOCKED);
    }

    this.validateBlockedUntil(input.blockedUntil);

    const updatedUser = await this.db.user.update({
      where: { id: userId },
      data: {
        isBlocked: true,
        blockedUntil: input.blockedUntil,
        blockReason: input.blockReason,
      },
      select: USER_VIEW_SELECT,
    });

    await this.session.deleteAllForUser(userId);
    await this.createAdminLog(adminId, ADMIN_LOG_ACTIONS.USER_BLOCKED, userId, {
      blockReason: input.blockReason,
      blockedUntil: input.blockedUntil.toISOString(),
    });
    await this.invalidateUserCaches(userId);

    return this.mapUser(updatedUser);
  }

  async unblockUser(adminId: string, userId: string): Promise<UserEntity> {
    const user = await this.findUserById(userId);

    if (!user.isBlocked) {
      throw new BadRequestException(AUTH_ADMIN_MESSAGES.USER_NOT_BLOCKED);
    }

    const updatedUser = await this.db.user.update({
      where: { id: userId },
      data: {
        isBlocked: false,
        blockedUntil: null,
        blockReason: null,
      },
      select: USER_VIEW_SELECT,
    });

    await this.createAdminLog(
      adminId,
      ADMIN_LOG_ACTIONS.USER_UNBLOCKED,
      userId,
      null,
    );
    await this.invalidateUserCaches(userId);

    return this.mapUser(updatedUser);
  }

  private async invalidateUserCaches(userId: string): Promise<void> {
    await Promise.all([
      this.redis.del(CACHE_KEYS.adminUser(userId), CACHE_KEYS.me(userId)),
      this.redis.delByPrefix(CACHE_KEYS.adminUsersPrefix()),
    ]);
  }

  private buildUserQuery(
    pagination: UserPaginationInput,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (pagination.search) {
      where.nickname = {
        contains: pagination.search,
        mode: 'insensitive',
      };
    }

    if (pagination.role) {
      where.role = pagination.role;
    }

    if (pagination.isBlocked !== undefined) {
      where.isBlocked = pagination.isBlocked;
    }

    return where;
  }

  private async findUserById(id: string): Promise<UserView> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: USER_VIEW_SELECT,
    });

    if (!user) {
      throw new NotFoundException(AUTH_ADMIN_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  private validateBlockedUntil(blockedUntil: Date): void {
    if (Number.isNaN(blockedUntil.getTime())) {
      throw new BadRequestException(AUTH_ADMIN_MESSAGES.INVALID_BLOCK_DATE);
    }

    if (blockedUntil <= new Date()) {
      throw new BadRequestException(AUTH_ADMIN_MESSAGES.BLOCK_PREVIOUS_DATE);
    }

    const maxBlockDate = new Date();
    maxBlockDate.setFullYear(
      maxBlockDate.getFullYear() + AUTH_CONFIG.BLOCK.MAX_DATE_YEAR,
    );

    if (blockedUntil > maxBlockDate) {
      throw new BadRequestException(AUTH_ADMIN_MESSAGES.BLOCK_TOO_FAR);
    }
  }

  private async createAdminLog(
    adminId: string,
    action: AdminLogAction,
    targetUserId: string,
    details: Prisma.InputJsonValue | null,
  ): Promise<void> {
    await this.db.adminLog.create({
      data: {
        adminId,
        action,
        targetUserId,
        details: details ?? undefined,
      },
    });
  }

  private mapUser(user: UserView): UserEntity {
    return {
      id: user.id,
      nickname: user.nickname,
      role: user.role as UserRole,
      roleLabel: getUserRoleLabel(user.role as UserRole),
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil,
      blockReason: user.blockReason,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private mapSession(session: SessionRecord): SessionEntity {
    return {
      ...session,
      isCurrent: false,
    };
  }
}
