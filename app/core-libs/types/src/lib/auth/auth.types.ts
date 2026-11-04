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

export type CosmeticSlot = 'HAT' | 'BACKGROUND' | 'ACCESSORY';

export type CosmeticRarity = 'COMMON' | 'RARE' | 'EPIC';

export type UpgradeEffectType = 'CLICK_POWER' | 'AUTO_INCOME';

export type AchievementCondition =
  'TOTAL_CLICKS' | 'TOTAL_FEEDS' | 'LEVEL' | 'TOTAL_COINS_EARNED' | 'STREAK';

export interface PetEntity {
  id: string;
  name: string;
  level: number;
  xp: number;
  hunger: number;
  mood: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStatisticEntity {
  id: string;
  coins: string;
  totalCoinsEarned: string;
  totalClicks: string;
  totalFeeds: string;
  streak: number;
  clickPower: number;
  autoIncome: number;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginStreakEntity {
  id: string;
  currentStreak: number;
  bestStreak: number;
  lastClaimDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  hungerRestore: number;
  moodBonus: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodInventoryEntity {
  id: string;
  quantity: number;
  food: FoodEntity;
  createdAt: Date;
  updatedAt: Date;
}

export interface CosmeticEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  slot: CosmeticSlot;
  rarity: CosmeticRarity;
  createdAt: Date;
  updatedAt: Date;
}

export interface CosmeticInventoryEntity {
  id: string;
  isEquipped: boolean;
  cosmetic: CosmeticEntity;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpgradeEntity {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  effectType: UpgradeEffectType;
  effectValue: number;
  basePrice: number;
  priceMultiplier: string;
  maxLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpgradeEntity {
  id: string;
  level: number;
  upgrade: UpgradeEntity;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementEntity {
  id: string;
  code: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  conditionType: AchievementCondition;
  conditionValue: number;
  rewardCoins: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievementEntity {
  id: string;
  achievement: AchievementEntity;
  createdAt: Date;
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
