import { WsException } from '@nestjs/websockets';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { AuthWsGuard } from './ws-auth.guard';

import type { ExecutionContext } from '@nestjs/common';

function createContext(client: unknown): ExecutionContext {
  return {
    switchToWs: () => ({
      getClient: () => client,
    }),
  } as unknown as ExecutionContext;
}

describe('AuthWsGuard', () => {
  it('allows authenticated sockets', () => {
    const guard = new AuthWsGuard();
    const context = createContext({
      data: { user: { id: 'user-1' } },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects sockets without an authenticated user', () => {
    const guard = new AuthWsGuard();
    const context = createContext({ data: {} });

    expect(() => guard.canActivate(context)).toThrow(WsException);
    expect(() => guard.canActivate(context)).toThrow(
      AUTH_MESSAGES.UNAUTHORIZED,
    );
  });

  it('rejects sockets without a data object', () => {
    const guard = new AuthWsGuard();
    const context = createContext({});

    expect(() => guard.canActivate(context)).toThrow(WsException);
  });
});
