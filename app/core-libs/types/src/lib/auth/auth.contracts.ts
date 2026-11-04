import type {
  AuthSessionResult,
  BlockUserInput,
  ChangePasswordInput,
  ChangeSessionLocalNameInput,
  LoginInput,
  MeEntity,
  RegisterInput,
  SessionEntity,
  UserEntity,
} from './auth.types.js';
import type { ClientMeta } from '../shared/client-meta.types.js';
import type {
  PaginatedUsersOutput,
  UserPaginationInput,
} from '../shared/pagination.types.js';

export interface AuthServiceContract {
  register(input: RegisterInput, meta: ClientMeta): Promise<AuthSessionResult>;
  login(input: LoginInput, meta: ClientMeta): Promise<AuthSessionResult>;
  refresh(refreshToken: string, meta: ClientMeta): Promise<AuthSessionResult>;
  logout(refreshToken?: string): Promise<void>;
  me(userId: string): Promise<MeEntity>;
  changePassword(
    userId: string,
    sessionId: string,
    input: ChangePasswordInput,
  ): Promise<void>;
}

export interface AuthSessionServiceContract {
  getMySessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionEntity[]>;
  changeLocalName(
    userId: string,
    sessionId: string,
    currentSessionId: string,
    input: ChangeSessionLocalNameInput,
  ): Promise<SessionEntity>;
  deleteSession(
    userId: string,
    sessionId: string,
    currentSessionId: string,
  ): Promise<void>;
  deleteAllSessions(userId: string, currentSessionId: string): Promise<void>;
}

export interface AuthAdminServiceContract {
  getUsers(pagination: UserPaginationInput): Promise<PaginatedUsersOutput>;
  getUserById(id: string): Promise<UserEntity>;
  getUserSessions(id: string): Promise<SessionEntity[]>;
  revokeUserSessions(adminId: string, userId: string): Promise<void>;
  blockUser(
    adminId: string,
    userId: string,
    input: BlockUserInput,
  ): Promise<UserEntity>;
  unblockUser(adminId: string, userId: string): Promise<UserEntity>;
}
