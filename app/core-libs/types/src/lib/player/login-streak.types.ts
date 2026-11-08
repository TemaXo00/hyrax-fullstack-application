export interface LoginStreakEntity {
  id: string;
  currentStreak: number;
  bestStreak: number;
  lastClaimDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
