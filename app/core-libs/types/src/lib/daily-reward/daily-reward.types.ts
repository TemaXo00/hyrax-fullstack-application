import type { CosmeticEntity } from '../cosmetic/cosmetic.types.js';

export interface DailyRewardEntity {
  id: string;
  dayNumber: number;
  rewardCoins: number;
  rewardItem: CosmeticEntity | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyRewardStateEntity {
  currentStreak: number;
  bestStreak: number;
  lastClaimDate: Date | null;
  canClaim: boolean;
  dayNumber: number;
  rewards: DailyRewardEntity[];
}

export interface DailyRewardClaimEntity {
  dayNumber: number;
  rewardCoins: number;
  rewardItem: CosmeticEntity | null;
  itemGranted: boolean;
  currentStreak: number;
  bestStreak: number;
  lastClaimDate: Date;
  canClaim: boolean;
  coinsBalance: string;
  totalCoinsEarned: string;
}

export interface UpdateDailyRewardAdminInput {
  rewardCoins?: number;
  rewardItemId?: string | null;
}
