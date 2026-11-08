import type { UserAchievementEntity } from '../achievement/achievement.types.js';
import type { CosmeticInventoryEntity } from '../cosmetic/cosmetic.types.js';
import type { FoodInventoryEntity } from '../food/food.types.js';
import type { PetEntity } from '../pet/pet.types.js';
import type { LoginStreakEntity } from '../player/login-streak.types.js';
import type { PlayerStatisticEntity } from '../player/player-statistic.types.js';
import type { UserUpgradeEntity } from '../upgrade/upgrade.types.js';

export const USER_ROLES = ['PLAYER', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  PLAYER: 'Игрок',
  ADMIN: 'Администратор',
};

export const USER_ROLE_OPTIONS = USER_ROLES.map(
  (role) => USER_ROLE_LABELS[role],
).join(', ');

export const getUserRoleLabel = (role: UserRole): string =>
  USER_ROLE_LABELS[role];

export const AUTH_ROLES_KEY = 'auth:roles';

export const ADMIN_LOG_ACTIONS = {
  USER_BLOCKED: 'USER_BLOCKED',
  USER_UNBLOCKED: 'USER_UNBLOCKED',
  USER_SESSIONS_REVOKED: 'USER_SESSIONS_REVOKED',
} as const;

export type AdminLogAction =
  (typeof ADMIN_LOG_ACTIONS)[keyof typeof ADMIN_LOG_ACTIONS];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthJwtPayload {
  id: string;
  sessionId: string;
  role: UserRole;
}

export interface AuthenticatedUser extends AuthJwtPayload {
  nickname: string;
  isBlocked: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserEntity {
  id: string;
  nickname: string;
  role: UserRole;
  roleLabel: string;
  isBlocked: boolean;
  blockedUntil: Date | null;
  blockReason: string | null;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface SessionEntity {
  id: string;
  localName: string | null;
  ip: string;
  userAgent: string;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeEntity extends UserEntity {
  pet: PetEntity | null;
  stats: PlayerStatisticEntity | null;
  streak: LoginStreakEntity | null;
  foodInventory: FoodInventoryEntity[];
  cosmeticInventory: CosmeticInventoryEntity[];
  upgrades: UserUpgradeEntity[];
  achievements: UserAchievementEntity[];
}

export interface RegisterInput {
  nickname: string;
  password: string;
  passwordConfirmation: string;
}

export interface LoginInput {
  nickname: string;
  password: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface ChangeSessionLocalNameInput {
  localName: string;
}

export interface BlockUserInput {
  blockReason: string;
  blockedUntil: Date;
}

export interface AuthSessionResult extends AuthTokens {
  user: UserEntity;
}

export interface AuthResponse {
  accessToken: string;
  user: UserEntity;
}
