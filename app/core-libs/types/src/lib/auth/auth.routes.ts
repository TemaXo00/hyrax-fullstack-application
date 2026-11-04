export const AUTH_ROUTES = {
  BASE: 'auth',
  REGISTER: 'register',
  LOGIN: 'login',
  REFRESH: 'refresh',
  LOGOUT: 'logout',
  ME: 'me',
  CHANGE_PASSWORD: 'password/change',
} as const;

export const AUTH_SESSION_ROUTES = {
  BASE: 'auth/sessions',
  GET_MY_SESSIONS: '',
  CHANGE_LOCAL_NAME: ':id',
  DELETE_SESSION: ':id',
  DELETE_ALL_SESSIONS: '',
} as const;

export const AUTH_ADMIN_ROUTES = {
  BASE: 'auth/admin/users',
  GET_USERS: '',
  GET_USER_BY_ID: ':id',
  GET_USER_SESSIONS: ':id/sessions',
  REVOKE_USER_SESSIONS: ':id/sessions',
  BLOCK_USER: ':id/block',
  UNBLOCK_USER: ':id/unblock',
} as const;
