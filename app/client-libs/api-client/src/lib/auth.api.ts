import { AUTH_ROUTES } from '@org/types';

import { request } from './http';

import type { Serialized } from './types';
import type {
  AuthResponse,
  LoginInput,
  MeEntity,
  RegisterInput,
} from '@org/types';

export type AuthResult = Serialized<AuthResponse>;
export type Me = Serialized<MeEntity>;

export async function register(input: RegisterInput): Promise<AuthResult> {
  return await request<AuthResult>(
    `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REGISTER}`,
    {
      method: 'POST',
      body: input,
      retryOnUnauthorized: false,
    },
  );
}

export async function login(input: LoginInput): Promise<AuthResult> {
  return await request<AuthResult>(
    `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.LOGIN}`,
    {
      method: 'POST',
      body: input,
      retryOnUnauthorized: false,
    },
  );
}

export async function logout(): Promise<void> {
  await request<void>(`/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.LOGOUT}`, {
    method: 'POST',
    retryOnUnauthorized: false,
  });
}

export async function getMe(): Promise<Me> {
  return await request<Me>(`/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.ME}`);
}
