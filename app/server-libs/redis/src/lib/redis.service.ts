import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';

import type Redis from 'ioredis';

const DEFAULT_TTL_SECONDS = 60;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly defaultTtlSeconds: number;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    config: ConfigService,
  ) {
    const configuredTtl = Number(
      config.get<string | number>(
        'HYRAX_REDIS_CACHE_TTL_SECONDS',
        DEFAULT_TTL_SECONDS,
      ),
    );

    this.defaultTtlSeconds =
      Number.isFinite(configuredTtl) && configuredTtl > 0
        ? configuredTtl
        : DEFAULT_TTL_SECONDS;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);

      return raw ? (JSON.parse(raw, this.reviveDates) as T) : null;
    } catch (error) {
      this.logger.warn(
        `Redis GET failed for key "${key}": ${this.errorMessage(error)}`,
      );

      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Redis SET failed for key "${key}": ${this.errorMessage(error)}`,
      );
    }
  }

  async del(...keys: string[]): Promise<void> {
    const existingKeys = keys.filter(Boolean);

    if (existingKeys.length === 0) {
      return;
    }

    try {
      await this.redis.del(...existingKeys);
    } catch (error) {
      this.logger.warn(`Redis DEL failed: ${this.errorMessage(error)}`);
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      let cursor = '0';

      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,
        );

        cursor = nextCursor;

        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(
        `Redis SCAN/DEL failed for prefix "${prefix}": ${this.errorMessage(error)}`,
      );
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();

    await this.set(key, value, ttlSeconds);

    return value;
  }

  private readonly reviveDates = (_key: string, value: unknown): unknown => {
    if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
      return new Date(value);
    }

    return value;
  };

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
