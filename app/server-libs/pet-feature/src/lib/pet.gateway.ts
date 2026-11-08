import {
  BadRequestException,
  HttpException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { AuthWsGuard, AuthWsService } from '@org/auth-core';
import { PET_WS_EVENTS, PET_WS_NAMESPACE } from '@org/types';
import { GAME_CONFIG } from '@org/validation-config';
import { PET_MESSAGES } from '@org/validation-messages';

import { PetFeatureService } from './pet-feature.service';

import type {
  PetWsErrorPayload,
  PetWsFeedPayload,
  AuthenticatedUser,
} from '@org/types';
import type { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: AuthenticatedUser;
  };
}

@WebSocketGateway({
  namespace: PET_WS_NAMESPACE,
  cors: {
    origin: process.env.HYRAX_SERVER_CORS_ORIGINS?.split(',') ?? true,
    credentials: true,
  },
})
@UseGuards(AuthWsGuard)
export class PetGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PetGateway.name);
  private readonly lastActionAt = new Map<string, number>();

  constructor(
    private readonly auth: AuthWsService,
    private readonly pet: PetFeatureService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const user = await this.auth.authenticate(this.extractToken(client));

      client.data.user = user;
      client.emit(PET_WS_EVENTS.STATE, await this.pet.getState(user.id));
    } catch (error) {
      client.emit(PET_WS_EVENTS.ERROR, this.toErrorPayload(error));
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.lastActionAt.delete(client.id);
  }

  @SubscribeMessage(PET_WS_EVENTS.STATE)
  async onState(@ConnectedSocket() client: AuthenticatedSocket): Promise<void> {
    try {
      const user = this.getUser(client);

      client.emit(PET_WS_EVENTS.STATE, await this.pet.getState(user.id));
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage(PET_WS_EVENTS.CLICK)
  async onClick(@ConnectedSocket() client: AuthenticatedSocket): Promise<void> {
    await this.runAction(client, PET_WS_EVENTS.CLICK, async (user) =>
      this.pet.click(user.id),
    );
  }

  @SubscribeMessage(PET_WS_EVENTS.WALK)
  async onWalk(@ConnectedSocket() client: AuthenticatedSocket): Promise<void> {
    await this.runAction(client, PET_WS_EVENTS.WALK, async (user) =>
      this.pet.walk(user.id),
    );
  }

  @SubscribeMessage(PET_WS_EVENTS.FEED)
  async onFeed(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: PetWsFeedPayload,
  ): Promise<void> {
    await this.runAction(client, PET_WS_EVENTS.FEED, async (user) =>
      this.pet.feed(user.id, { foodId: payload?.foodId }),
    );
  }

  private async runAction(
    client: AuthenticatedSocket,
    event: string,
    action: (user: AuthenticatedUser) => Promise<unknown>,
  ): Promise<void> {
    try {
      const user = this.getUser(client);

      this.assertCooldown(client.id);

      client.emit(event, await action(user));
    } catch (error) {
      this.emitError(client, error);
    }
  }

  private getUser(client: AuthenticatedSocket): AuthenticatedUser {
    const user = client.data.user;

    if (!user) {
      throw new BadRequestException(PET_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  private assertCooldown(clientId: string): void {
    const now = Date.now();
    const lastAction = this.lastActionAt.get(clientId) ?? 0;

    if (now - lastAction < GAME_CONFIG.THROTTLE.WS_ACTION_COOLDOWN_MS) {
      throw new BadRequestException(PET_MESSAGES.WS_ACTION_TOO_FAST);
    }

    this.lastActionAt.set(clientId, now);
  }

  private emitError(client: AuthenticatedSocket, error: unknown): void {
    if (!(error instanceof HttpException) && !(error instanceof WsException)) {
      this.logger.error(error);
    }

    client.emit(PET_WS_EVENTS.ERROR, this.toErrorPayload(error));
  }

  private toErrorPayload(error: unknown): PetWsErrorPayload {
    if (error instanceof HttpException) {
      return {
        statusCode: error.getStatus(),
        message: this.resolveHttpMessage(error),
      };
    }

    if (error instanceof WsException) {
      const payload = error.getError();

      return {
        statusCode: 401,
        message:
          typeof payload === 'string' ? payload : PET_MESSAGES.INTERNAL_ERROR,
      };
    }

    return {
      statusCode: 500,
      message: PET_MESSAGES.INTERNAL_ERROR,
    };
  }

  private resolveHttpMessage(error: HttpException): string {
    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const message = (response as { message?: string | string[] }).message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return error.message;
  }

  private extractToken(client: AuthenticatedSocket): string | undefined {
    const authToken = client.handshake.auth?.token as string | undefined;
    const queryToken = client.handshake.query?.token;
    const header = client.handshake.headers?.authorization;

    const token =
      authToken ?? (Array.isArray(queryToken) ? queryToken[0] : queryToken);

    if (token) {
      return token.replace(/^Bearer\s+/i, '');
    }

    if (typeof header === 'string') {
      return header.replace(/^Bearer\s+/i, '');
    }

    return undefined;
  }
}
