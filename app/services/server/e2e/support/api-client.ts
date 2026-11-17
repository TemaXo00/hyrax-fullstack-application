import type {
  AuthResponse,
  MeEntity,
  PetActionResultEntity,
  PetEntity,
  PetStateEntity,
} from '@org/types';

export type HttpMethod = 'GET' | 'QUERY' | 'POST' | 'PATCH' | 'DELETE';

export interface SuccessEnvelope<T> {
  status: 'success';
  date: string;
  time: string;
  path: string;
  data: T;
  duration: string;
}

export interface ErrorEnvelope {
  status: 'error';
  timestamp: string;
  path: string;
  method: string;
  message: string;
  duration: string;
}

export interface ApiResult<T> {
  status: number;
  body: SuccessEnvelope<T> | ErrorEnvelope;
  headers: Headers;
}

export type AuthResult = AuthResponse;

export interface RegisterPayload {
  nickname: string;
  password: string;
  passwordConfirmation?: string;
}

const DEFAULT_PASSWORD = 'Secret123';

export const DEFAULT_USER_PASSWORD = DEFAULT_PASSWORD;

export class ApiClient {
  private accessToken: string | null = null;
  private readonly cookies = new Map<string, string>();

  constructor(
    private readonly baseUrl: string,
    private readonly ip: string,
  ) {}

  get token(): string | null {
    return this.accessToken;
  }

  set token(value: string | null) {
    this.accessToken = value;
  }

  get cookieHeader(): string {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  getCookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  async register(
    nickname: string,
    password: string = DEFAULT_PASSWORD,
    passwordConfirmation: string = password,
  ): Promise<ApiResult<AuthResult>> {
    const result = await this.post<AuthResult>(
      '/auth/register',
      { nickname, password, passwordConfirmation },
      { auth: false },
    );

    this.useAccessToken(result);

    return result;
  }

  async login(
    nickname: string,
    password: string = DEFAULT_PASSWORD,
  ): Promise<ApiResult<AuthResult>> {
    const result = await this.post<AuthResult>(
      '/auth/login',
      { nickname, password },
      { auth: false },
    );

    this.useAccessToken(result);

    return result;
  }

  async refresh(): Promise<ApiResult<AuthResult>> {
    const result = await this.post<AuthResult>('/auth/refresh', undefined, {
      auth: false,
    });

    this.useAccessToken(result);

    return result;
  }

  logout(): Promise<ApiResult<null>> {
    return this.post<null>('/auth/logout', undefined, { auth: false });
  }

  me(): Promise<ApiResult<MeEntity>> {
    return this.get<MeEntity>('/auth/me');
  }

  petState(): Promise<ApiResult<PetStateEntity>> {
    return this.get<PetStateEntity>('/pets/me');
  }

  renamePet(name: string): Promise<ApiResult<PetEntity>> {
    return this.patch<PetEntity>('/pets/name', { name });
  }

  clickPet(): Promise<ApiResult<PetActionResultEntity>> {
    return this.post<PetActionResultEntity>('/pets/click');
  }

  walkPet(clicks: number): Promise<ApiResult<PetActionResultEntity>> {
    return this.post<PetActionResultEntity>('/pets/walk', { clicks });
  }

  feedPet(foodId: string): Promise<ApiResult<PetActionResultEntity>> {
    return this.post<PetActionResultEntity>('/pets/feed', { foodId });
  }

  get<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('GET', path, options);
  }

  query<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return this.request<T>('QUERY', path, { body });
  }

  post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResult<T>> {
    return this.request<T>('POST', path, { body, ...options });
  }

  patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResult<T>> {
    return this.request<T>('PATCH', path, { body, ...options });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {
      'x-forwarded-for': this.ip,
      'user-agent': 'hyrax-e2e',
    };

    if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
    }

    if (this.cookies.size > 0) {
      headers.cookie = this.cookieHeader;
    }

    if (options.auth !== false && this.accessToken) {
      headers.authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}/api${path}`, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    this.storeCookies(response.headers);

    const text = await response.text();

    return {
      status: response.status,
      body: text
        ? (JSON.parse(text) as SuccessEnvelope<T> | ErrorEnvelope)
        : ({ status: 'success', data: null } as unknown as SuccessEnvelope<T>),
      headers: response.headers,
    };
  }

  private useAccessToken(result: ApiResult<AuthResult>): void {
    if (result.body.status === 'success') {
      this.accessToken = result.body.data.accessToken;
    }
  }

  private storeCookies(headers: Headers): void {
    for (const rawCookie of headers.getSetCookie()) {
      const [pair] = rawCookie.split(';');
      const separatorIndex = pair.indexOf('=');
      const name = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();

      if (value) {
        this.cookies.set(name, value);
      } else {
        this.cookies.delete(name);
      }
    }
  }
}

interface RequestOptions {
  body?: unknown;
  auth?: boolean;
}

export function getData<T>(result: ApiResult<T>): T {
  if (result.body.status !== 'success') {
    throw new Error(
      `Ожидался успешный ответ, получен статус ${result.status}: ${result.body.message}`,
    );
  }

  return result.body.data;
}

export function getErrorMessage(result: ApiResult<unknown>): string {
  return result.body.status === 'error' ? result.body.message : '';
}
