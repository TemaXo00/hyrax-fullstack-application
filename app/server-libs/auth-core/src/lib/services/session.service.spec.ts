import { CACHE_KEYS } from '@org/redis';

import { AuthSessionService } from './session.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';
const SESSION_ID = 'session-1';

const SESSION = {
  id: SESSION_ID,
  localName: null,
  ip: '127.0.0.1',
  userAgent: 'jest',
  createdAt: NOW,
  updatedAt: NOW,
};

function setup(): {
  service: AuthSessionService;
  db: {
    session: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  redis: {
    del: jest.Mock;
    delByPrefix: jest.Mock;
  };
} {
  const db = {
    session: {
      create: jest.fn().mockResolvedValue(undefined),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const redis = {
    del: jest.fn().mockResolvedValue(undefined),
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthSessionService(
    db as unknown as DatabaseService,
    redis as unknown as RedisService,
  );

  return { service, db, redis };
}

describe('AuthSessionService', () => {
  it('creates a session', async () => {
    const { service, db } = setup();

    await service.create({
      id: SESSION_ID,
      userId: USER_ID,
      refreshTokenHash: 'hash',
      meta: { ip: '127.0.0.1', userAgent: 'jest' },
    });

    expect(db.session.create).toHaveBeenCalledWith({
      data: {
        id: SESSION_ID,
        userId: USER_ID,
        refreshTokenHash: 'hash',
        ip: '127.0.0.1',
        userAgent: 'jest',
      },
    });
  });

  it('finds a session by id', async () => {
    const { service, db } = setup();

    db.session.findUnique.mockResolvedValue({
      id: SESSION_ID,
      userId: USER_ID,
      refreshTokenHash: 'hash',
    });

    await expect(service.findById(SESSION_ID)).resolves.toEqual({
      id: SESSION_ID,
      userId: USER_ID,
      refreshTokenHash: 'hash',
    });
    expect(db.session.findUnique).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      select: { id: true, userId: true, refreshTokenHash: true },
    });
  });

  it('lists user sessions', async () => {
    const { service, db } = setup();

    db.session.findMany.mockResolvedValue([SESSION]);

    await expect(service.listByUser(USER_ID)).resolves.toEqual([SESSION]);
    expect(db.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } }),
    );
  });

  it('finds an owned session', async () => {
    const { service, db } = setup();

    db.session.findFirst.mockResolvedValue(SESSION);

    await expect(service.findByIdForUser(SESSION_ID, USER_ID)).resolves.toEqual(
      SESSION,
    );
    expect(db.session.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SESSION_ID, userId: USER_ID },
      }),
    );
  });

  it('updates the local name', async () => {
    const { service, db } = setup();
    const updated = { ...SESSION, localName: 'Работа' };

    db.session.update.mockResolvedValue(updated);

    await expect(
      service.updateLocalName(SESSION_ID, 'Работа'),
    ).resolves.toEqual(updated);
    expect(db.session.update).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: { localName: 'Работа' },
      select: expect.any(Object),
    });
  });

  it('deletes an owned session and its cache', async () => {
    const { service, db, redis } = setup();

    await service.deleteByIdForUser(SESSION_ID, USER_ID);

    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { id: SESSION_ID, userId: USER_ID },
    });
    expect(redis.del).toHaveBeenCalledWith(
      CACHE_KEYS.authSession(USER_ID, SESSION_ID),
    );
  });

  it('rotates the refresh token hash', async () => {
    const { service, db } = setup();

    await service.rotate(SESSION_ID, 'new-hash');

    expect(db.session.update).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: { refreshTokenHash: 'new-hash' },
    });
  });

  it('deletes a session and its cache', async () => {
    const { service, db, redis } = setup();

    await service.delete(SESSION_ID, USER_ID);

    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { id: SESSION_ID, userId: USER_ID },
    });
    expect(redis.del).toHaveBeenCalledWith(
      CACHE_KEYS.authSession(USER_ID, SESSION_ID),
    );
  });

  it('deletes all sessions except the current one', async () => {
    const { service, db, redis } = setup();

    await service.deleteAllForUser(USER_ID, SESSION_ID);

    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, NOT: { id: SESSION_ID } },
    });
    expect(redis.delByPrefix).toHaveBeenCalledWith(
      CACHE_KEYS.authSessionPrefix(USER_ID),
    );
  });

  it('deletes every session when no exception is given', async () => {
    const { service, db } = setup();

    await service.deleteAllForUser(USER_ID);

    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
  });
});
