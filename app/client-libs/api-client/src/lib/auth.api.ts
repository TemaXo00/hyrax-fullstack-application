import { AUTH_ROUTES } from '@org/types';

import { request } from './http';

import type { Serialized } from './types';
import type { LoginInput, MeEntity, RegisterInput, AuthResponse } from '@org/types';

export type AuthResult = Serialized<AuthResponse>;
export type Me = Serialized<MeEntity>;

export async function register(input: RegisterInput): Promise<AuthResult> {
  return await request<AuthResult>({
    url: `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REGISTER}`,
    method: 'POST',
    data: input,
  });
}

export async function login(input: LoginInput): Promise<AuthResult> {
  return await request<AuthResult>({
    url: `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.LOGIN}`,
    method: 'POST',
    data: input,
  });
}

export async function refresh(): Promise<AuthResult> {
  return await request<AuthResult>({
    url: `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REFRESH}`,
    method: 'POST',
  });
}

export async function logout(): Promise<void> {
  await request<void>({
    url: `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.LOGOUT}`,
    method: 'POST',
  });
}

export async function getMe(): Promise<Me> {
  return await request<Me>({
    url: `/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.ME}`,
    method: 'GET',
  });
}
