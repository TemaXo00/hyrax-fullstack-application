import { AUTH_MESSAGES, THROTTLE_MESSAGES } from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import { nextClientIp, setupE2e } from './support/setup';

import type { ErrorEnvelope } from './support/api-client';
import type { PetActionResultEntity } from '@org/types';

const getContext = setupE2e();

interface OpenApiOperation {
  security?: Array<Record<string, string[]>>;
  responses?: Record<string, unknown>;
  parameters?: Array<{ name: string; in: string }>;
}

interface OpenApiDocument {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    securitySchemes?: Record<string, unknown>;
  };
}

describe('Security and API contract (e2e)', () => {
  it('возвращает единый формат ошибок и 404 для неизвестного маршрута', async () => {
    const client = getContext().client();

    const response = await client.get('/unknown-route');
    const body = response.body as ErrorEnvelope;

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      status: 'error',
      path: '/api/unknown-route',
      method: 'GET',
      message: 'Cannot GET /api/unknown-route',
    });
    expect(Date.parse(body.timestamp)).not.toBeNaN();
    expect(body.duration).toMatch(/^\d+ms$/);

    const unauthorized = await client.get('/pets/me');
    const unauthorizedBody = unauthorized.body as ErrorEnvelope;

    expect(unauthorized.status).toBe(401);
    expect(unauthorizedBody).toMatchObject({
      status: 'error',
      path: '/api/pets/me',
      method: 'GET',
      message: AUTH_MESSAGES.UNAUTHORIZED,
    });
  });

  it('ограничивает частоту выгула и возвращает 429', async () => {
    const client = getContext().client(nextClientIp());

    await client.register('Игрок');

    const statuses: number[] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await client.post<PetActionResultEntity>('/pets/walk', {
        clicks: 1,
      });

      statuses.push(response.status);

      if (response.status === 429) {
        expect(getErrorMessage(response)).toBe(THROTTLE_MESSAGES.EXCEEDED);
      }
    }

    expect(statuses[0]).toBe(201);
    expect(statuses.slice(1, 5)).toEqual([400, 400, 400, 400]);
    expect(statuses[5]).toBe(429);
  });

  it('публикует Swagger-контракт с защищёнными и типизированными маршрутами', async () => {
    const client = getContext().client();

    const response = await client.get('/docs/swagger.json');

    expect(response.status).toBe(200);

    const document = response.body as unknown as OpenApiDocument;

    expect(document.components?.securitySchemes).toHaveProperty('bearer');
    expect(document.paths['/api/auth/register'].post.responses).toHaveProperty(
      '201',
    );
    expect(document.paths['/api/auth/register'].post.responses).toHaveProperty(
      '409',
    );
    expect(document.paths['/api/auth/register'].post.responses).toHaveProperty(
      '429',
    );
    expect(document.paths['/api/auth/me'].get.security).toEqual([
      { bearer: [] },
    ]);
    expect(document.paths['/api/pets/walk'].post.responses).toHaveProperty(
      '201',
    );
    expect(document.paths['/api/pets/walk'].post.responses).toHaveProperty(
      '401',
    );
    expect(document.paths['/api/shop/foods'].query).toBeDefined();
    expect(document.paths['/api/shop/upgrades'].query.responses).toHaveProperty(
      '403',
    );
    expect(document.paths['/api/admin/pets'].query.security).toEqual([
      { bearer: [] },
    ]);
    expect(
      document.paths['/api/admin/shop/foods'].post.responses,
    ).toHaveProperty('403');
    expect(document.paths['/api/auth/admin/users'].query.security).toEqual([
      { bearer: [] },
    ]);
  });

  it('не раскрывает пароли и токены в ответах', async () => {
    const client = getContext().client();

    const registered = await client.register('Игрок');
    const serialized = JSON.stringify(registered.body);

    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('refreshToken');

    const me = getData(await client.me());
    const serializedMe = JSON.stringify(me);

    expect(serializedMe).not.toContain('passwordHash');
    expect(serializedMe).not.toContain('refreshTokenHash');
  });
});
