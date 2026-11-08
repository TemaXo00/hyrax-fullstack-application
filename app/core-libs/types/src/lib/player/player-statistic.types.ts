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
