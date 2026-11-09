import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PET_WS_EVENTS } from '@org/types';
import { GAME_CONFIG } from '@org/validation-config';
import { AUTH_MESSAGES, PET_MESSAGES } from '@org/validation-messages';

import { PetGateway } from './pet.gateway';

import type { PetFeatureService } from './pet-feature.service';
import type { AuthWsService } from '@org/auth-core';
import type { AuthenticatedUser } from '@org/types';

const NOW = new Date('2026-11-08T12:00:00.000Z');

const USER: AuthenticatedUser = {
  id: 'user-1',
  sessionId: 'session-1',
  role: 'PLAYER',
  nickname: 'Тест',
  isBlocked: false,
  createdAt: NOW,
  lastLoginAt: NOW,
};

interface FakeClient {
  id: string;
  data: { user?: AuthenticatedUser };
  handshake: {
    auth: { token?: string };
    query: { token?: string };
    headers: { authorization?: string };
  };
  emit: jest.Mock;
  disconnect: jest.Mock;
}

function createClient(overrides: Partial<FakeClient> = {}): FakeClient {
  return {
    id: 'socket-1',
    data: {},
    handshake: {
      auth: { token: 'auth-token' },
      query: {},
      headers: {},
    },
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  };
}

function setup(): {
  gateway: PetGateway;
  auth: { authenticate: jest.Mock };
  pet: {
    getState: jest.Mock;
    click: jest.Mock;
    walk: jest.Mock;
    feed: jest.Mock;
  };
} {
  const auth = {
    authenticate: jest.fn().mockResolvedValue(USER),
  };
  const pet = {
    getState: jest.fn().mockResolvedValue({ pet: { id: 'pet-1' } }),
    click: jest.fn().mockResolvedValue({ coinsEarned: '1' }),
    walk: jest.fn().mockResolvedValue({ coinsEarned: '5' }),
    feed: jest.fn().mockResolvedValue({ coinsEarned: '0' }),
  };
  const gateway = new PetGateway(
    auth as unknown as AuthWsService,
    pet as unknown as PetFeatureService,
  );

  return { gateway, auth, pet };
}

describe('PetGateway', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('handleConnection', () => {
    it('authenticates the socket and sends the initial state', async () => {
      const { gateway, auth, pet } = setup();
      const client = createClient();

      await gateway.handleConnection(client as never);

      expect(auth.authenticate).toHaveBeenCalledWith('auth-token');
      expect(client.data.user).toBe(USER);
      expect(pet.getState).toHaveBeenCalledWith(USER.id);
      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.STATE, {
        pet: { id: 'pet-1' },
      });
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('takes the token from the query string', async () => {
      const { gateway, auth } = setup();
      const client = createClient({
        handshake: {
          auth: {},
          query: { token: 'query-token' },
          headers: {},
        },
      });

      await gateway.handleConnection(client as never);

      expect(auth.authenticate).toHaveBeenCalledWith('query-token');
    });

    it('takes a bearer token from the authorization header', async () => {
      const { gateway, auth } = setup();
      const client = createClient({
        handshake: {
          auth: {},
          query: {},
          headers: { authorization: 'Bearer header-token' },
        },
      });

      await gateway.handleConnection(client as never);

      expect(auth.authenticate).toHaveBeenCalledWith('header-token');
    });

    it('emits an error and disconnects when authentication fails', async () => {
      const { gateway, auth } = setup();
      const client = createClient();

      auth.authenticate.mockRejectedValue(
        new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN),
      );

      await gateway.handleConnection(client as never);

      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.ERROR, {
        statusCode: 401,
        message: AUTH_MESSAGES.INVALID_TOKEN,
      });
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('actions', () => {
    it('sends the current state on request', async () => {
      const { gateway, pet } = setup();
      const client = createClient({ data: { user: USER } });

      await gateway.onState(client as never);

      expect(pet.getState).toHaveBeenCalledWith(USER.id);
      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.STATE, {
        pet: { id: 'pet-1' },
      });
    });

    it('performs a click and emits the result', async () => {
      const { gateway, pet } = setup();
      const client = createClient({ data: { user: USER } });

      await gateway.onClick(client as never);

      expect(pet.click).toHaveBeenCalledWith(USER.id);
      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.CLICK, {
        coinsEarned: '1',
      });
    });

    it('performs a walk and emits the result', async () => {
      const { gateway, pet } = setup();
      const client = createClient({ data: { user: USER } });

      await gateway.onWalk(client as never);

      expect(pet.walk).toHaveBeenCalledWith(USER.id);
      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.WALK, {
        coinsEarned: '5',
      });
    });

    it('passes the food id when feeding', async () => {
      const { gateway, pet } = setup();
      const client = createClient({ data: { user: USER } });

      await gateway.onFeed(client as never, { foodId: 'food-1' });

      expect(pet.feed).toHaveBeenCalledWith(USER.id, { foodId: 'food-1' });
      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.FEED, {
        coinsEarned: '0',
      });
    });

    it('rate limits actions that happen too quickly on one socket', async () => {
      const { gateway, pet } = setup();
      const client = createClient({ data: { user: USER } });

      await gateway.onClick(client as never);
      jest.setSystemTime(
        new Date(
          NOW.getTime() + GAME_CONFIG.THROTTLE.WS_ACTION_COOLDOWN_MS - 1,
        ),
      );
      await gateway.onClick(client as never);

      expect(pet.click).toHaveBeenCalledTimes(1);
      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.ERROR, {
        statusCode: 400,
        message: PET_MESSAGES.WS_ACTION_TOO_FAST,
      });
    });

    it('allows the next action once the cooldown has passed', async () => {
      const { gateway, pet } = setup();
      const client = createClient({ data: { user: USER } });

      await gateway.onClick(client as never);
      jest.setSystemTime(
        new Date(
          NOW.getTime() + GAME_CONFIG.THROTTLE.WS_ACTION_COOLDOWN_MS + 1,
        ),
      );
      await gateway.onClick(client as never);

      expect(pet.click).toHaveBeenCalledTimes(2);
    });

    it('frees the cooldown on disconnect', async () => {
      const { gateway, pet } = setup();
      const client = createClient({ data: { user: USER } });

      await gateway.onClick(client as never);
      gateway.handleDisconnect(client as never);
      await gateway.onClick(client as never);

      expect(pet.click).toHaveBeenCalledTimes(2);
    });

    it('emits an error when the socket has no user', async () => {
      const { gateway, pet } = setup();
      const client = createClient();

      await gateway.onClick(client as never);

      expect(pet.click).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.ERROR, {
        statusCode: 400,
        message: PET_MESSAGES.USER_NOT_FOUND,
      });
    });

    it('maps domain errors into an error event', async () => {
      const { gateway, pet } = setup();
      const client = createClient({ data: { user: USER } });

      pet.walk.mockRejectedValue(
        new BadRequestException(PET_MESSAGES.WALK_COOLDOWN(30)),
      );

      await gateway.onWalk(client as never);

      expect(client.emit).toHaveBeenCalledWith(PET_WS_EVENTS.ERROR, {
        statusCode: 400,
        message: PET_MESSAGES.WALK_COOLDOWN(30),
      });
    });
  });
});
