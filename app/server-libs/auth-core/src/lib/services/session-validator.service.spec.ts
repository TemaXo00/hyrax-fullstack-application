import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';

import { AuthSessionValidatorService } from './session-validator.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';
const SESSION_ID = 'session-1';

const PAYLOAD = { id: USER_ID, sessionId: SESSION_ID, role: 'PLAYER' as const };

const USER = {
  id: USER_ID,
  nickname: 'Тест',
  role: 'PLAYER' as const,
  isBlocked: false,
  blockedUntil: null,
  blockReason: null,
  createdAt: NOW,
  lastLoginAt: NOW,
  sessions: [{ id: SESSION_ID }],
};

interface Setup {
  service: AuthSessionValidatorService;
  db: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    delByPrefix: jest.Mock;
  };
}

function setup(): Setup {
  const db = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthSessionValidatorService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, redis };
}

describe('AuthSessionValidatorService', () => {
  it('returns the cached authenticated user', async () => {
    const { service, db, redis } = setup();
    const cached = { id: USER_ID, nickname: 'Тест' };

    redis.get.mockResolvedValue(cached);

    await expect(service.validate(PAYLOAD)).resolves.toBe(cached);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a missing user or session and clears the cache', async () => {
    const { service, db, redis } = setup();

    db.user.findUnique.mockResolvedValue(null);

    await expect(service.validate(PAYLOAD)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(redis.del).toHaveBeenCalledWith(
      CACHE_KEYS.authSession(USER_ID, SESSION_ID),
    );
  });

  it('rejects a user without the current session', async () => {
    const { service, db } = setup();

    db.user.findUnique.mockResolvedValue({ ...USER, sessions: [] });

    await expect(service.validate(PAYLOAD)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('unblocks an expired block and invalidates caches', async () => {
    const { service, db, redis } = setup();

    db.user.findUnique.mockResolvedValue({
      ...USER,
      isBlocked: true,
      blockedUntil: new Date(NOW.getTime() - 1000),
    });
    db.user.update.mockResolvedValue({ ...USER, isBlocked: false });

    const result = await service.validate(PAYLOAD);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { isBlocked: false, blockedUntil: null, blockReason: null },
    });
    expect(redis.del).toHaveBeenCalledWith(
      CACHE_KEYS.me(USER_ID),
      CACHE_KEYS.adminUser(USER_ID),
    );
    expect(redis.delByPrefix).toHaveBeenCalledWith(
      CACHE_KEYS.adminUsersPrefix(),
    );
    expect(result).toMatchObject({ id: USER_ID, isBlocked: false });
  });

  it('rejects an actively blocked user and clears the session cache', async () => {
    const { service, db, redis } = setup();

    db.user.findUnique.mockResolvedValue({
      ...USER,
      isBlocked: true,
      blockedUntil: new Date(Date.now() + 60_000),
      blockReason: 'Нарушение',
    });

    await expect(service.validate(PAYLOAD)).rejects.toThrow(ForbiddenException);
    expect(redis.del).toHaveBeenCalledWith(
      CACHE_KEYS.authSession(USER_ID, SESSION_ID),
    );
  });

  it('caches and returns the authenticated user', async () => {
    const { service, db, redis } = setup();

    db.user.findUnique.mockResolvedValue(USER);

    const result = await service.validate(PAYLOAD);

    expect(result).toEqual({
      id: USER_ID,
      sessionId: SESSION_ID,
      role: 'PLAYER',
      nickname: 'Тест',
      isBlocked: false,
      createdAt: NOW,
      lastLoginAt: NOW,
    });
    expect(redis.set).toHaveBeenCalledWith(
      CACHE_KEYS.authSession(USER_ID, SESSION_ID),
      result,
    );
  });
});
