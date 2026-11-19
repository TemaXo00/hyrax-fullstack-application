import { AUTH_ROUTES } from '@org/types';
import { FetchError, ofetch } from 'ofetch';

import type { FetchOptions } from 'ofetch';
import type { ApiEnvelope, ApiErrorEnvelope } from './types';

const API_BASE_URL = '/api';

const REFRESH_PATH = `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REFRESH}`;

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'QUERY';
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  retryOnUnauthorized?: boolean;
}

const transport = ofetch.create({
  baseURL: API_BASE_URL,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof FetchError && error.response?.status === 401;
}

async function performRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = { ...options.headers };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const fetchOptions: FetchOptions<'json'> = {
    method: (options.method ?? 'GET') as FetchOptions['method'],
    body: options.body as FetchOptions['body'],
    query: options.query as FetchOptions['query'],
    headers,
  };

  const response = await transport<ApiEnvelope<T>>(path, fetchOptions);

  return response.data;
}

async function refreshAccessToken(notify = true): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = transport<ApiEnvelope<{ accessToken: string }>>(
      REFRESH_PATH,
      { method: 'POST' },
    )
      .then((response) => {
        const token = response.data.accessToken;

        setAccessToken(token);

        return token;
      })
      .catch(() => {
        setAccessToken(null);

        if (notify) {
          onUnauthorized?.();
        }

        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return await refreshPromise;
}

/**
 * Публичное обновление токена для восстановления сессии при загрузке
 * приложения. Возвращает access-токен или null, если cookie недействительна.
 */
export function restoreAccessToken(): Promise<string | null> {
  return refreshAccessToken(false);
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await performRequest<T>(path, options);
  } catch (error) {
    if (isUnauthorized(error) && options.retryOnUnauthorized !== false) {
      const token = await refreshAccessToken();

      if (token) {
        return await performRequest<T>(path, options);
      }
    }

    throw error;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    const data = error.data as ApiErrorEnvelope | { message?: string | string[] } | undefined;
    const message = data?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (message) {
      return message;
    }

    if (error.response?.status === 429) {
      return 'Слишком часто. Дайте питомцу немного отдохнуть.';
    }

    if (!error.response) {
      return 'Не удалось связаться с сервером. Проверьте, запущен ли API.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}
