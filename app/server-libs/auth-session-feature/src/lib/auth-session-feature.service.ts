import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthSessionService } from '@org/auth-core';
import { AUTH_MESSAGES } from '@org/validation-messages';

import type { SessionRecord } from '@org/auth-core';
import type {
  AuthSessionServiceContract,
  ChangeSessionLocalNameInput,
  SessionEntity,
} from '@org/types';

@Injectable()
export class AuthSessionFeatureService implements AuthSessionServiceContract {
  constructor(private readonly session: AuthSessionService) {}

  async getMySessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionEntity[]> {
    const sessions = await this.session.listByUser(userId);

    return sessions.map((session) =>
      this.mapSession(session, currentSessionId),
    );
  }

  async changeLocalName(
    userId: string,
    sessionId: string,
    currentSessionId: string,
    input: ChangeSessionLocalNameInput,
  ): Promise<SessionEntity> {
    await this.findOwnedSession(userId, sessionId);
    const session = await this.session.updateLocalName(
      sessionId,
      input.localName,
    );

    return this.mapSession(session, currentSessionId);
  }

  async deleteSession(
    userId: string,
    sessionId: string,
    currentSessionId: string,
  ): Promise<void> {
    if (sessionId === currentSessionId) {
      throw new BadRequestException(
        AUTH_MESSAGES.CANNOT_DELETE_CURRENT_SESSION,
      );
    }

    await this.findOwnedSession(userId, sessionId);
    await this.session.deleteByIdForUser(sessionId, userId);
  }

  async deleteAllSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void> {
    await this.session.deleteAllForUser(userId, currentSessionId);
  }

  private async findOwnedSession(
    userId: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const session = await this.session.findByIdForUser(sessionId, userId);

    if (!session) {
      throw new NotFoundException(AUTH_MESSAGES.SESSION_NOT_FOUND);
    }

    return session;
  }

  private mapSession(
    session: SessionRecord,
    currentSessionId: string,
  ): SessionEntity {
    return {
      ...session,
      isCurrent: session.id === currentSessionId,
    };
  }
}
