import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AuthSessionFeatureService } from './auth-session-feature.service';

import type { AuthSessionService, SessionRecord } from '@org/auth-core';

const NOW = new Date('2026-11-08T12:00:00.000Z');
const USER_ID = 'user-1';

function buildSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'session-1',
    localName: null,
    ip: '127.0.0.1',
    userAgent: 'jest',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function setup(): {
  service: AuthSessionFeatureService;
  session: {
    listByUser: jest.Mock;
    findByIdForUser: jest.Mock;
    updateLocalName: jest.Mock;
    deleteByIdForUser: jest.Mock;
    deleteAllForUser: jest.Mock;
  };
} {
  const session = {
    listByUser: jest.fn(),
    findByIdForUser: jest.fn(),
    updateLocalName: jest.fn(),
    deleteByIdForUser: jest.fn().mockResolvedValue(undefined),
    deleteAllForUser: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthSessionFeatureService(
    session as unknown as AuthSessionService,
  );

  return { service, session };
}

describe('AuthSessionFeatureService', () => {
  describe('getMySessions', () => {
    it('marks the current session', async () => {
      const { service, session } = setup();

      session.listByUser.mockResolvedValue([
        buildSession({ id: 'session-1' }),
        buildSession({ id: 'session-2' }),
      ]);

      const result = await service.getMySessions(USER_ID, 'session-2');

      expect(result).toEqual([
        expect.objectContaining({ id: 'session-1', isCurrent: false }),
        expect.objectContaining({ id: 'session-2', isCurrent: true }),
      ]);
    });
  });

  describe('changeLocalName', () => {
    it('throws when the session is not owned by the user', async () => {
      const { service, session } = setup();

      session.findByIdForUser.mockResolvedValue(null);

      await expect(
        service.changeLocalName(USER_ID, 'session-2', 'session-1', {
          localName: 'Работа',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the local name and returns the session', async () => {
      const { service, session } = setup();
      const updated = buildSession({ id: 'session-2', localName: 'Работа' });

      session.findByIdForUser.mockResolvedValue(
        buildSession({ id: 'session-2' }),
      );
      session.updateLocalName.mockResolvedValue(updated);

      const result = await service.changeLocalName(
        USER_ID,
        'session-2',
        'session-1',
        { localName: 'Работа' },
      );

      expect(session.updateLocalName).toHaveBeenCalledWith(
        'session-2',
        'Работа',
      );
      expect(result).toMatchObject({
        id: 'session-2',
        localName: 'Работа',
        isCurrent: false,
      });
    });
  });

  describe('deleteSession', () => {
    it('rejects deleting the current session', async () => {
      const { service, session } = setup();

      await expect(
        service.deleteSession(USER_ID, 'session-1', 'session-1'),
      ).rejects.toThrow(BadRequestException);
      expect(session.findByIdForUser).not.toHaveBeenCalled();
    });

    it('throws when the session is not owned by the user', async () => {
      const { service, session } = setup();

      session.findByIdForUser.mockResolvedValue(null);

      await expect(
        service.deleteSession(USER_ID, 'session-2', 'session-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes an owned session', async () => {
      const { service, session } = setup();

      session.findByIdForUser.mockResolvedValue(
        buildSession({ id: 'session-2' }),
      );

      await service.deleteSession(USER_ID, 'session-2', 'session-1');

      expect(session.deleteByIdForUser).toHaveBeenCalledWith(
        'session-2',
        USER_ID,
      );
    });
  });

  describe('deleteAllSessions', () => {
    it('keeps the current session', async () => {
      const { service, session } = setup();

      await service.deleteAllSessions(USER_ID, 'session-1');

      expect(session.deleteAllForUser).toHaveBeenCalledWith(
        USER_ID,
        'session-1',
      );
    });
  });
});
