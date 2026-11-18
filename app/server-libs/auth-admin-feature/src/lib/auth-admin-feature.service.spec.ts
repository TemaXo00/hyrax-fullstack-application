import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ADMIN_LOG_ACTIONS } from '@org/types';
import { AUTH_ADMIN_MESSAGES } from '@org/validation-messages';

import { AuthAdminFeatureService } from './auth-admin-feature.service';

import type { AuthSessionService } from '@org/auth-core';
import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const ADMIN_ID = 'admin-1';
const USER_ID = 'user-1';

const USER = {
  id: USER_ID,
  nickname: 'Тест',
  role: 'PLAYER' as const,
  isBlocked: false,
  blockedUntil: null,
  blockReason: null,
  createdAt: NOW,
  lastLoginAt: NOW,
};

interface Setup {
  service: AuthAdminFeatureService;
  db: {
    user: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    adminLog: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };
  session: {
    listByUser: jest.Mock;
    deleteAllForUser: jest.Mock;
  };
  redis: {
    getOrSet: jest.Mock;
    del: jest.Mock;
    delByPrefix: jest.Mock;
  };
}

function setup(): Setup {
  const db = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminLog: {
      create: jest.fn().mockResolvedValue(undefined),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const session = {
    listByUser: jest.fn(),
    deleteAllForUser: jest.fn().mockResolvedValue(undefined),
  };
  const redis = {
    getOrSet: jest.fn(),
    del: jest.fn().mockResolvedValue(undefined),
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthAdminFeatureService(
    db as unknown as DatabaseService,
    session as unknown as AuthSessionService,
    redis as unknown as RedisService,
  );

  return { service, db, session, redis };
}

function useCache(redis: Setup['redis']): void {
  redis.getOrSet.mockImplementation(
    async (_key: string, factory: () => Promise<unknown>) => factory(),
  );
}

describe('AuthAdminFeatureService', () => {
  describe('getUsers', () => {
    it('uses defaults, applies filters and maps users', async () => {
      const { service, db, redis } = setup();
      useCache(redis);
      db.user.count.mockResolvedValue(21);
      db.user.findMany.mockResolvedValue([USER]);

      const result = await service.getUsers({
        search: 'Тест',
        role: 'PLAYER',
        isBlocked: false,
      });

      expect(db.user.count).toHaveBeenCalledWith({
        where: {
          nickname: { contains: 'Тест', mode: 'insensitive' },
          role: 'PLAYER',
          isBlocked: false,
        },
      });
      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        }),
      );
      expect(result).toEqual({
        pagination: {
          page: 1,
          limit: 10,
          total: 21,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
          search: 'Тест',
        },
        users: [expect.objectContaining({ id: USER_ID, roleLabel: 'Игрок' })],
      });
    });

    it('honours explicit pagination and hasPrev', async () => {
      const { service, db, redis } = setup();
      useCache(redis);
      db.user.count.mockResolvedValue(30);
      db.user.findMany.mockResolvedValue([]);

      const result = await service.getUsers({ page: 2, limit: 5 });

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
      expect(result.pagination).toMatchObject({
        page: 2,
        limit: 5,
        totalPages: 6,
        hasNext: true,
        hasPrev: true,
      });
    });
  });

  describe('getUserById', () => {
    it('returns a cached user', async () => {
      const { service, db, redis } = setup();
      useCache(redis);
      db.user.findUnique.mockResolvedValue(USER);

      const result = await service.getUserById(USER_ID);

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: expect.any(Object),
      });
      expect(result).toMatchObject({ id: USER_ID, roleLabel: 'Игрок' });
    });

    it('throws when the user does not exist', async () => {
      const { service, db, redis } = setup();
      useCache(redis);
      db.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById(USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserSessions', () => {
    it('returns sessions of an existing user', async () => {
      const { service, db, session } = setup();

      db.user.findUnique.mockResolvedValue(USER);
      session.listByUser.mockResolvedValue([
        {
          id: 'session-1',
          localName: null,
          ip: '127.0.0.1',
          userAgent: 'jest',
          createdAt: NOW,
          updatedAt: NOW,
        },
      ]);

      const result = await service.getUserSessions(USER_ID);

      expect(result).toEqual([
        expect.objectContaining({ id: 'session-1', isCurrent: false }),
      ]);
    });

    it('throws when the user does not exist', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserSessions(USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('revokeUserSessions', () => {
    it('revokes sessions and writes an admin log', async () => {
      const { service, db, session } = setup();

      db.user.findUnique.mockResolvedValue(USER);

      await service.revokeUserSessions(ADMIN_ID, USER_ID);

      expect(session.deleteAllForUser).toHaveBeenCalledWith(USER_ID);
      expect(db.adminLog.create).toHaveBeenCalledWith({
        data: {
          adminId: ADMIN_ID,
          action: ADMIN_LOG_ACTIONS.USER_SESSIONS_REVOKED,
          targetUserId: USER_ID,
          details: undefined,
        },
      });
    });
  });

  describe('blockUser', () => {
    it('rejects blocking the admin account', async () => {
      const { service } = setup();

      await expect(
        service.blockUser(ADMIN_ID, ADMIN_ID, {
          blockReason: 'Причина',
          blockedUntil: new Date(Date.now() + 60_000),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the user does not exist', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(null);

      await expect(
        service.blockUser(ADMIN_ID, USER_ID, {
          blockReason: 'Причина',
          blockedUntil: new Date(Date.now() + 60_000),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an already blocked user', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue({ ...USER, isBlocked: true });

      await expect(
        service.blockUser(ADMIN_ID, USER_ID, {
          blockReason: 'Причина',
          blockedUntil: new Date(Date.now() + 60_000),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid block date', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(USER);

      await expect(
        service.blockUser(ADMIN_ID, USER_ID, {
          blockReason: 'Причина',
          blockedUntil: new Date('invalid'),
        }),
      ).rejects.toThrow(AUTH_ADMIN_MESSAGES.INVALID_BLOCK_DATE);
    });

    it('rejects a date in the past', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(USER);

      await expect(
        service.blockUser(ADMIN_ID, USER_ID, {
          blockReason: 'Причина',
          blockedUntil: new Date(Date.now() - 60_000),
        }),
      ).rejects.toThrow(AUTH_ADMIN_MESSAGES.BLOCK_PREVIOUS_DATE);
    });

    it('rejects a date too far in the future', async () => {
      const { service, db } = setup();
      const farDate = new Date();

      farDate.setFullYear(farDate.getFullYear() + 100);
      db.user.findUnique.mockResolvedValue(USER);

      await expect(
        service.blockUser(ADMIN_ID, USER_ID, {
          blockReason: 'Причина',
          blockedUntil: farDate,
        }),
      ).rejects.toThrow(AUTH_ADMIN_MESSAGES.BLOCK_TOO_FAR);
    });

    it('blocks the user, revokes sessions, logs and invalidates caches', async () => {
      const { service, db, session, redis } = setup();
      const blockedUntil = new Date(Date.now() + 60_000);

      db.user.findUnique.mockResolvedValue(USER);
      db.user.update.mockResolvedValue({
        ...USER,
        isBlocked: true,
        blockedUntil,
        blockReason: 'Причина',
      });

      const result = await service.blockUser(ADMIN_ID, USER_ID, {
        blockReason: 'Причина',
        blockedUntil,
      });

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: {
          isBlocked: true,
          blockedUntil,
          blockReason: 'Причина',
        },
        select: expect.any(Object),
      });
      expect(session.deleteAllForUser).toHaveBeenCalledWith(USER_ID);
      expect(db.adminLog.create).toHaveBeenCalledWith({
        data: {
          adminId: ADMIN_ID,
          action: ADMIN_LOG_ACTIONS.USER_BLOCKED,
          targetUserId: USER_ID,
          details: {
            blockReason: 'Причина',
            blockedUntil: blockedUntil.toISOString(),
          },
        },
      });
      expect(redis.del).toHaveBeenCalled();
      expect(redis.delByPrefix).toHaveBeenCalled();
      expect(result).toMatchObject({ id: USER_ID, isBlocked: true });
    });
  });

  describe('getLogs', () => {
    it('filters and maps the admin log', async () => {
      const { service, db } = setup();

      db.adminLog.count.mockResolvedValue(1);
      db.adminLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: ADMIN_LOG_ACTIONS.USER_BLOCKED,
          admin: { id: ADMIN_ID, nickname: 'Админ' },
          targetUser: { id: USER_ID, nickname: 'Тест' },
          details: { blockReason: 'Причина' },
          createdAt: NOW,
        },
      ]);

      const result = await service.getLogs({
        action: ADMIN_LOG_ACTIONS.USER_BLOCKED,
        adminId: ADMIN_ID,
        targetUserId: USER_ID,
        page: 2,
        limit: 5,
      });

      expect(db.adminLog.findMany).toHaveBeenCalledWith({
        where: {
          action: ADMIN_LOG_ACTIONS.USER_BLOCKED,
          adminId: ADMIN_ID,
          targetUserId: USER_ID,
        },
        include: {
          admin: { select: { id: true, nickname: true } },
          targetUser: { select: { id: true, nickname: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: 5,
        take: 5,
      });
      expect(result).toEqual({
        pagination: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: true,
        },
        logs: [
          {
            id: 'log-1',
            action: ADMIN_LOG_ACTIONS.USER_BLOCKED,
            admin: { id: ADMIN_ID, nickname: 'Админ' },
            targetUser: { id: USER_ID, nickname: 'Тест' },
            details: { blockReason: 'Причина' },
            createdAt: NOW,
          },
        ],
      });
    });
  });

  describe('unblockUser', () => {
    it('rejects an unlocked user', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(USER);

      await expect(service.unblockUser(ADMIN_ID, USER_ID)).rejects.toThrow(
        AUTH_ADMIN_MESSAGES.USER_NOT_BLOCKED,
      );
    });

    it('unblocks the user, logs and invalidates caches', async () => {
      const { service, db, redis } = setup();

      db.user.findUnique.mockResolvedValue({
        ...USER,
        isBlocked: true,
        blockedUntil: new Date(Date.now() + 60_000),
        blockReason: 'Причина',
      });
      db.user.update.mockResolvedValue(USER);

      const result = await service.unblockUser(ADMIN_ID, USER_ID);

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: {
          isBlocked: false,
          blockedUntil: null,
          blockReason: null,
        },
        select: expect.any(Object),
      });
      expect(db.adminLog.create).toHaveBeenCalledWith({
        data: {
          adminId: ADMIN_ID,
          action: ADMIN_LOG_ACTIONS.USER_UNBLOCKED,
          targetUserId: USER_ID,
          details: undefined,
        },
      });
      expect(redis.del).toHaveBeenCalled();
      expect(result).toMatchObject({ id: USER_ID, isBlocked: false });
    });
  });
});
