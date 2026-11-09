import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_KEYS } from '@org/redis';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthFeatureService } from './auth-feature.service';

import type { DatabaseService } from '@org/database';
import type { RedisService } from '@org/redis';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';
const SESSION_ID = 'session-1';

const META = { ip: '127.0.0.1', userAgent: 'jest' };

const USER = {
  id: USER_ID,
  nickname: 'Тест',
  passwordHash: 'stored-hash',
  role: 'PLAYER' as const,
  isBlocked: false,
  blockedUntil: null,
  blockReason: null,
  createdAt: NOW,
  lastLoginAt: NOW,
};

const TOKENS = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

interface Setup {
  service: AuthFeatureService;
  db: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  password: {
    hash: jest.Mock;
    verify: jest.Mock;
    verifyOrThrow: jest.Mock;
    validateConfirmation: jest.Mock;
    validateNewPassword: jest.Mock;
  };
  token: {
    generateTokens: jest.Mock;
    verifyRefreshToken: jest.Mock;
    hashToken: jest.Mock;
    verifyTokenHash: jest.Mock;
  };
  session: {
    create: jest.Mock;
    findById: jest.Mock;
    rotate: jest.Mock;
    delete: jest.Mock;
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
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const password = {
    hash: jest.fn().mockResolvedValue('new-hash'),
    verify: jest.fn().mockResolvedValue(true),
    verifyOrThrow: jest.fn().mockResolvedValue(undefined),
    validateConfirmation: jest.fn(),
    validateNewPassword: jest.fn(),
  };
  const token = {
    generateTokens: jest.fn().mockReturnValue(TOKENS),
    verifyRefreshToken: jest
      .fn()
      .mockReturnValue({ id: USER_ID, sessionId: SESSION_ID, role: 'PLAYER' }),
    hashToken: jest.fn().mockResolvedValue('refresh-hash'),
    verifyTokenHash: jest.fn().mockResolvedValue(undefined),
  };
  const session = {
    create: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue({
      id: SESSION_ID,
      userId: USER_ID,
      refreshTokenHash: 'refresh-hash',
    }),
    rotate: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    deleteAllForUser: jest.fn().mockResolvedValue(undefined),
  };
  const redis = {
    getOrSet: jest.fn(),
    del: jest.fn().mockResolvedValue(undefined),
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthFeatureService(
    db as unknown as DatabaseService,
    password,
    token,
    session,
    redis as unknown as RedisService,
  );

  return { service, db, password, token, session, redis };
}

describe('AuthFeatureService', () => {
  describe('register', () => {
    it('rejects an existing nickname', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue({ id: USER_ID });

      await expect(
        service.register(
          {
            nickname: 'Тест',
            password: 'Password1!',
            passwordConfirmation: 'Password1!',
          },
          META,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a user, session and returns tokens without the refresh token', async () => {
      const { service, db, password, token, session, redis } = setup();

      db.user.findUnique.mockResolvedValue(null);
      db.user.create.mockResolvedValue(USER);

      const result = await service.register(
        {
          nickname: 'Тест',
          password: 'Password1!',
          passwordConfirmation: 'Password1!',
        },
        META,
      );

      expect(password.validateConfirmation).toHaveBeenCalledWith(
        'Password1!',
        'Password1!',
      );
      expect(password.hash).toHaveBeenCalledWith('Password1!');
      expect(db.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nickname: 'Тест',
          passwordHash: 'new-hash',
          pet: {
            create: { name: 'Питомец Тест', updatedAt: expect.any(Date) },
          },
          stats: { create: {} },
        }),
      });
      expect(token.generateTokens).toHaveBeenCalledWith({
        id: USER_ID,
        sessionId: expect.any(String),
        role: 'PLAYER',
      });
      expect(session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          refreshTokenHash: 'refresh-hash',
          meta: META,
        }),
      );
      expect(redis.delByPrefix).toHaveBeenCalledWith(
        CACHE_KEYS.adminUsersPrefix(),
      );
      expect(result).toEqual({
        ...TOKENS,
        user: expect.objectContaining({ id: USER_ID, roleLabel: 'Игрок' }),
      });
    });
  });

  describe('login', () => {
    it('rejects an unknown nickname', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ nickname: 'Тест', password: 'Password1!' }, META),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an invalid password', async () => {
      const { service, db, password } = setup();

      db.user.findUnique.mockResolvedValue(USER);
      password.verify.mockResolvedValue(false);

      await expect(
        service.login({ nickname: 'Тест', password: 'wrong' }, META),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a blocked user with the block reason', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue({
        ...USER,
        isBlocked: true,
        blockReason: 'Нарушение правил',
      });

      await expect(
        service.login({ nickname: 'Тест', password: 'Password1!' }, META),
      ).rejects.toThrow(ForbiddenException);
    });

    it('unblocks a user whose block has expired', async () => {
      const { service, db } = setup();
      const blockedUser = {
        ...USER,
        isBlocked: true,
        blockedUntil: new Date(NOW.getTime() - 1000),
        blockReason: 'Старая блокировка',
      };

      db.user.findUnique.mockResolvedValue(blockedUser);
      db.user.update
        .mockResolvedValueOnce({ ...blockedUser, isBlocked: false })
        .mockResolvedValueOnce(USER);

      const result = await service.login(
        { nickname: 'Тест', password: 'Password1!' },
        META,
      );

      expect(db.user.update).toHaveBeenNthCalledWith(1, {
        where: { id: USER_ID },
        data: { isBlocked: false, blockedUntil: null, blockReason: null },
      });
      expect(result.user.id).toBe(USER_ID);
    });

    it('updates last login, invalidates caches and creates a session', async () => {
      const { service, db, session, redis } = setup();

      db.user.findUnique.mockResolvedValue(USER);
      db.user.update.mockResolvedValue(USER);

      const result = await service.login(
        { nickname: 'Тест', password: 'Password1!' },
        META,
      );

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(redis.del).toHaveBeenCalledWith(
        CACHE_KEYS.me(USER_ID),
        CACHE_KEYS.adminUser(USER_ID),
      );
      expect(redis.delByPrefix).toHaveBeenCalledWith(
        CACHE_KEYS.adminUsersPrefix(),
      );
      expect(session.create).toHaveBeenCalled();
      expect(result).toEqual({
        ...TOKENS,
        user: expect.objectContaining({ id: USER_ID }),
      });
    });
  });

  describe('refresh', () => {
    it('rejects a session that does not belong to the token user', async () => {
      const { service, session } = setup();

      session.findById.mockResolvedValue({
        id: SESSION_ID,
        userId: 'another-user',
        refreshTokenHash: 'refresh-hash',
      });

      await expect(service.refresh('token', META)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an unknown user', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token', META)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rotates the refresh token and returns a fresh pair', async () => {
      const { service, db, token, session } = setup();

      db.user.findUnique.mockResolvedValue(USER);

      const result = await service.refresh('token', META);

      expect(token.verifyTokenHash).toHaveBeenCalledWith(
        'refresh-hash',
        'token',
      );
      expect(session.rotate).toHaveBeenCalledWith(SESSION_ID, 'refresh-hash');
      expect(result).toEqual({
        ...TOKENS,
        user: expect.objectContaining({ id: USER_ID }),
      });
    });

    it('rejects a blocked user', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue({
        ...USER,
        isBlocked: true,
        blockReason: 'Нарушение',
      });

      await expect(service.refresh('token', META)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('logout', () => {
    it('does nothing without a refresh token', async () => {
      const { service, session } = setup();

      await service.logout();

      expect(session.delete).not.toHaveBeenCalled();
    });

    it('ignores an invalid refresh token', async () => {
      const { service, token, session } = setup();

      token.verifyRefreshToken.mockImplementation(() => {
        throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN);
      });

      await service.logout('broken');

      expect(session.delete).not.toHaveBeenCalled();
    });

    it('deletes the current session', async () => {
      const { service, session } = setup();

      await service.logout('token');

      expect(session.delete).toHaveBeenCalledWith(SESSION_ID, USER_ID);
    });
  });

  describe('me', () => {
    it('returns a cached profile through getOrSet', async () => {
      const { service, redis } = setup();
      const cached = { id: USER_ID, nickname: 'Тест' };

      redis.getOrSet.mockResolvedValue(cached);

      await expect(service.me(USER_ID)).resolves.toBe(cached);
      expect(redis.getOrSet).toHaveBeenCalledWith(
        CACHE_KEYS.me(USER_ID),
        expect.any(Function),
      );
    });

    it('throws when the user does not exist', async () => {
      const { service, db, redis } = setup();

      redis.getOrSet.mockImplementation(
        async (_key: string, factory: () => Promise<unknown>) => factory(),
      );
      db.user.findUnique.mockResolvedValue(null);

      await expect(service.me(USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('maps related entities into the profile', async () => {
      const { service, db, redis } = setup();

      redis.getOrSet.mockImplementation(
        async (_key: string, factory: () => Promise<unknown>) => factory(),
      );
      db.user.findUnique.mockResolvedValue({
        ...USER,
        pet: {
          id: 'pet-1',
          name: 'Барсик',
          level: 2,
          xp: 10,
          hunger: 90,
          mood: 50,
          createdAt: NOW,
          updatedAt: NOW,
        },
        stats: {
          id: 'stats-1',
          coins: 100n,
          totalCoinsEarned: 200n,
          totalClicks: 3n,
          totalFeeds: 4n,
          streak: 1,
          clickPower: 1,
          autoIncome: 0,
          lastSyncAt: NOW,
          createdAt: NOW,
          updatedAt: NOW,
        },
        streak: {
          id: 'streak-1',
          currentStreak: 2,
          bestStreak: 5,
          lastClaimDate: NOW,
          createdAt: NOW,
          updatedAt: NOW,
        },
        foodInventories: [],
        cosmeticInventories: [],
        userUpgrades: [],
        userAchievments: [],
      });

      const result = await service.me(USER_ID);

      expect(result).toMatchObject({
        id: USER_ID,
        pet: { id: 'pet-1', moodStatus: 'NEUTRAL' },
        stats: { coins: '100' },
        streak: { currentStreak: 2 },
        foodInventory: [],
        cosmeticInventory: [],
        upgrades: [],
        achievements: [],
      });
    });
  });

  describe('changePassword', () => {
    it('throws when the user does not exist', async () => {
      const { service, db } = setup();

      db.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(USER_ID, SESSION_ID, {
          oldPassword: 'old',
          newPassword: 'NewPassword1!',
          newPasswordConfirmation: 'NewPassword1!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates an invalid current password', async () => {
      const { service, db, password } = setup();

      db.user.findUnique.mockResolvedValue(USER);
      password.verifyOrThrow.mockRejectedValue(
        new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS),
      );

      await expect(
        service.changePassword(USER_ID, SESSION_ID, {
          oldPassword: 'wrong',
          newPassword: 'NewPassword1!',
          newPasswordConfirmation: 'NewPassword1!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('updates the password and revokes other sessions', async () => {
      const { service, db, password, session, redis } = setup();

      db.user.findUnique.mockResolvedValue(USER);
      db.user.update.mockResolvedValue(USER);

      await service.changePassword(USER_ID, SESSION_ID, {
        oldPassword: 'old',
        newPassword: 'NewPassword1!',
        newPasswordConfirmation: 'NewPassword1!',
      });

      expect(password.validateConfirmation).toHaveBeenCalledWith(
        'NewPassword1!',
        'NewPassword1!',
      );
      expect(password.validateNewPassword).toHaveBeenCalledWith(
        'old',
        'NewPassword1!',
      );
      expect(password.hash).toHaveBeenCalledWith('NewPassword1!');
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { passwordHash: 'new-hash' },
      });
      expect(session.deleteAllForUser).toHaveBeenCalledWith(
        USER_ID,
        SESSION_ID,
      );
      expect(redis.del).toHaveBeenCalledWith(
        CACHE_KEYS.me(USER_ID),
        CACHE_KEYS.adminUser(USER_ID),
      );
    });
  });
});
