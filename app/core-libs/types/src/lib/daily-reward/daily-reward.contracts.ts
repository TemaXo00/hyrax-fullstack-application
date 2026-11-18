import type {
  DailyRewardClaimEntity,
  DailyRewardEntity,
  DailyRewardStateEntity,
  UpdateDailyRewardAdminInput,
} from './daily-reward.types.js';

export interface DailyRewardServiceContract {
  getState(userId: string): Promise<DailyRewardStateEntity>;
  claim(userId: string): Promise<DailyRewardClaimEntity>;
}

export interface DailyRewardAdminServiceContract {
  getRewards(): Promise<DailyRewardEntity[]>;
  updateReward(
    dayNumber: number,
    input: UpdateDailyRewardAdminInput,
  ): Promise<DailyRewardEntity>;
}
