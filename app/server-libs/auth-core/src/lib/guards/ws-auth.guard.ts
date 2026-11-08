import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AUTH_MESSAGES } from '@org/validation-messages';

import type { AuthenticatedUser } from '@org/types';
import type { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: AuthenticatedUser;
  };
}

@Injectable()
export class AuthWsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    if (!client.data?.user) {
      throw new WsException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    return true;
  }
}
