import { AUTH_ROUTES } from '@org/types';
import axios from 'axios';

import type { ApiEnvelope, ApiErrorEnvelope } from './types';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';


const API_BASE_URL = '/api';

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const REFRESH_URL = `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REFRESH}`;
const PUBLIC_AUTH_URLS = [
  REFRESH_URL,
  `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.LOGIN}`,
  `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REGISTER}`,
];

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function isPublicAuthUrl(url?: string): boolean {
  return Boolean(url && PUBLIC_AUTH_URLS.some((publicUrl) => url.endsWith(publicUrl)));
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<ApiEnvelope<{ accessToken: string }>>(REFRESH_URL)
      .then((response) => {
        const token = response.data.data.accessToken;

        setAccessToken(token);

        return token;
      })
      .catch(() => {
        setAccessToken(null);
        onUnauthorized?.();

        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return await refreshPromise;
}

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const isUnauthorized = error.response?.status === 401;

    if (
      !config ||
      !isUnauthorized ||
      config._retry ||
      isPublicAuthUrl(config.url)
    ) {
      return await Promise.reject(error);
    }

    config._retry = true;

    const token = await refreshAccessToken();

    if (!token) {
      return await Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${token}`;

    return await http.request(config);
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiEnvelope<T>>(config);

  return response.data.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const responseMessage = error.response?.data?.message;

    if (responseMessage) {
      return responseMessage;
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Не удалось связаться с сервером. Проверьте, запущен ли API.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}
