import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { CACHE_KEYS, RedisService } from '@org/redis';

import type { ClientMeta } from '@org/types';

interface CreateSessionInput {
  id: string;
  userId: string;
  refreshTokenHash: string;
  meta: ClientMeta;
}

export interface SessionRecord {
  id: string;
  localName: string | null;
  ip: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const SESSION_VIEW_SELECT = {
  id: true,
  localName: true,
  ip: true,
  userAgent: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async create(input: CreateSessionInput): Promise<void> {
    await this.db.session.create({
      data: {
        id: input.id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        ip: input.meta.ip,
        userAgent: input.meta.userAgent,
      },
    });
  }

  async findById(
    sessionId: string,
  ): Promise<{ id: string; userId: string; refreshTokenHash: string } | null> {
    return await this.db.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
      },
    });
  }

  async listByUser(userId: string): Promise<SessionRecord[]> {
    return await this.db.session.findMany({
      where: { userId },
      select: SESSION_VIEW_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdForUser(
    sessionId: string,
    userId: string,
  ): Promise<SessionRecord | null> {
    return await this.db.session.findFirst({
      where: { id: sessionId, userId },
      select: SESSION_VIEW_SELECT,
    });
  }

  async updateLocalName(
    sessionId: string,
    localName: string,
  ): Promise<SessionRecord> {
    return await this.db.session.update({
      where: { id: sessionId },
      data: { localName },
      select: SESSION_VIEW_SELECT,
    });
  }

  async deleteByIdForUser(sessionId: string, userId: string): Promise<void> {
    await this.db.session.deleteMany({
      where: { id: sessionId, userId },
    });
    await this.redis.del(CACHE_KEYS.authSession(userId, sessionId));
  }

  async rotate(sessionId: string, refreshTokenHash: string): Promise<void> {
    await this.db.session.update({
      where: { id: sessionId },
      data: { refreshTokenHash },
    });
  }

  async delete(sessionId: string, userId: string): Promise<void> {
    await this.db.session.deleteMany({ where: { id: sessionId, userId } });
    await this.redis.del(CACHE_KEYS.authSession(userId, sessionId));
  }

  async deleteAllForUser(
    userId: string,
    exceptSessionId?: string,
  ): Promise<void> {
    await this.db.session.deleteMany({
      where: {
        userId,
        ...(exceptSessionId ? { NOT: { id: exceptSessionId } } : {}),
      },
    });

    await this.redis.delByPrefix(CACHE_KEYS.authSessionPrefix(userId));
  }
}
