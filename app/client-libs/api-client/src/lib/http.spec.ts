import { AUTH_ROUTES } from '@org/types';
import { FetchError } from 'ofetch';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAccessToken,
  getApiErrorMessage,
  request,
  restoreAccessToken,
  setAccessToken,
  setUnauthorizedHandler,
} from './http';

const { transportMock } = vi.hoisted(() => ({
  transportMock: vi.fn(),
}));

vi.mock('ofetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ofetch')>();

  return {
    ...actual,
    ofetch: {
      ...actual.ofetch,
      create: () => transportMock,
    },
  };
});

const REFRESH_PATH = `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REFRESH}`;

function unauthorized(): FetchError {
  const error = new FetchError('unauthorized');

  Object.defineProperty(error, 'response', {
    value: { status: 401 },
  });

  return error;
}

function envelope<T>(data: T): { data: T; status: string } {
  return { data, status: 'success' };
}

beforeEach(() => {
  transportMock.mockReset();
  setAccessToken(null);
  setUnauthorizedHandler(null);
});

describe('request', () => {
  it('unwraps the envelope and adds the auth header', async () => {
    setAccessToken('token');
    transportMock.mockResolvedValue(envelope({ ok: true }));

    await expect(request('/pets/me')).resolves.toEqual({ ok: true });
    expect(transportMock).toHaveBeenCalledWith('/pets/me', {
      method: 'GET',
      body: undefined,
      query: undefined,
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('serializes QUERY bodies manually', async () => {
    transportMock.mockResolvedValue(envelope([]));

    await request('/achievements', {
      method: 'QUERY',
      body: { page: 2, search: 'кот' },
    });

    const [, options] = transportMock.mock.calls[0] as [
      string,
      { method: string; body: unknown },
    ];

    expect(options.method).toBe('QUERY');
    expect(options.body).toBe('{"page":2,"search":"кот"}');
  });

  it('does not double-serialize string QUERY bodies', async () => {
    transportMock.mockResolvedValue(envelope(null));

    await request('/leaderboard', { method: 'QUERY', body: '{"page":1}' });

    expect(transportMock.mock.calls[0]?.[1]).toMatchObject({
      body: '{"page":1}',
    });
  });

  it('leaves regular payload methods to ofetch', async () => {
    transportMock.mockResolvedValue(envelope({}));

    await request('/pets/feed', { method: 'POST', body: { foodId: '1' } });

    expect(transportMock.mock.calls[0]?.[1]).toMatchObject({
      body: { foodId: '1' },
    });
  });

  it('merges custom headers and query params', async () => {
    transportMock.mockResolvedValue(envelope({}));

    await request('/search', {
      headers: { 'X-Test': '1' },
      query: { page: 1 },
    });

    expect(transportMock.mock.calls[0]?.[1]).toMatchObject({
      headers: { 'X-Test': '1' },
      query: { page: 1 },
    });
  });
});

describe('token refresh', () => {
  it('refreshes the token and retries the request once', async () => {
    transportMock
      .mockRejectedValueOnce(unauthorized())
      .mockResolvedValueOnce(envelope({ accessToken: 'fresh' }))
      .mockResolvedValueOnce(envelope({ ok: true }));

    await expect(request('/pets/me')).resolves.toEqual({ ok: true });

    expect(transportMock).toHaveBeenNthCalledWith(2, REFRESH_PATH, {
      method: 'POST',
    });
    expect(transportMock).toHaveBeenNthCalledWith(3, '/pets/me', {
      method: 'GET',
      body: undefined,
      query: undefined,
      headers: { Authorization: 'Bearer fresh' },
    });
    expect(getAccessToken()).toBe('fresh');
  });

  it('does not refresh when retry is disabled', async () => {
    const error = unauthorized();

    transportMock.mockRejectedValueOnce(error);

    await expect(
      request('/auth/login', { retryOnUnauthorized: false }),
    ).rejects.toBe(error);
    expect(transportMock).toHaveBeenCalledTimes(1);
  });

  it('notifies about an expired session when refresh fails', async () => {
    const handler = vi.fn();

    setUnauthorizedHandler(handler);
    transportMock
      .mockRejectedValueOnce(unauthorized())
      .mockRejectedValueOnce(new Error('refresh failed'));

    await expect(request('/pets/me')).rejects.toBeInstanceOf(FetchError);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('restores the session without notifying listeners', async () => {
    const handler = vi.fn();

    setUnauthorizedHandler(handler);
    transportMock.mockRejectedValueOnce(new Error('no cookie'));

    await expect(restoreAccessToken()).resolves.toBeNull();
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns a restored token', async () => {
    transportMock.mockResolvedValueOnce(envelope({ accessToken: 'restored' }));

    await expect(restoreAccessToken()).resolves.toBe('restored');
    expect(getAccessToken()).toBe('restored');
  });

  it('shares a single refresh request between concurrent calls', async () => {
    transportMock
      .mockRejectedValueOnce(unauthorized())
      .mockRejectedValueOnce(unauthorized())
      .mockResolvedValueOnce(envelope({ accessToken: 'shared' }))
      .mockResolvedValueOnce(envelope({ first: true }))
      .mockResolvedValueOnce(envelope({ second: true }));

    const [first, second] = await Promise.all([
      request('/one'),
      request('/two'),
    ]);

    expect(first).toEqual({ first: true });
    expect(second).toEqual({ second: true });
    expect(
      transportMock.mock.calls.filter(([path]) => path === REFRESH_PATH),
    ).toHaveLength(1);
  });
});

describe('getApiErrorMessage', () => {
  it('reads string and array messages', () => {
    const error = new FetchError('fail');
    const arrayError = new FetchError('fail');

    Object.defineProperty(error, 'data', { value: { message: 'Плохо' } });
    expect(getApiErrorMessage(error)).toBe('Плохо');

    Object.defineProperty(arrayError, 'data', {
      value: { message: ['А', 'Б'] },
    });
    expect(getApiErrorMessage(arrayError)).toBe('А, Б');
  });

  it('handles rate limit, network and unknown errors', () => {
    const rateLimited = new FetchError('too many');

    Object.defineProperty(rateLimited, 'response', { value: { status: 429 } });
    expect(getApiErrorMessage(rateLimited)).toContain('Слишком часто');

    const offline = new FetchError('offline');

    Object.defineProperty(offline, 'response', { value: undefined });
    expect(getApiErrorMessage(offline)).toContain('Не удалось связаться');

    const server = new FetchError('boom');

    Object.defineProperty(server, 'response', { value: { status: 500 } });
    expect(getApiErrorMessage(server)).toBe('boom');

    expect(getApiErrorMessage(new Error('plain'))).toBe('plain');
    expect(getApiErrorMessage('text')).toBe('Произошла неизвестная ошибка');
  });
});
