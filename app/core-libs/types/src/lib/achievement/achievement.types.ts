export const ACHIEVEMENT_CONDITIONS = [
  'TOTAL_CLICKS',
  'TOTAL_FEEDS',
  'LEVEL',
  'TOTAL_COINS_EARNED',
  'STREAK',
] as const;

export type AchievementCondition = (typeof ACHIEVEMENT_CONDITIONS)[number];

export const ACHIEVEMENT_CONDITION_LABELS: Record<
  AchievementCondition,
  string
> = {
  TOTAL_CLICKS: 'Всего кликов',
  TOTAL_FEEDS: 'Всего кормлений',
  LEVEL: 'Уровень питомца',
  TOTAL_COINS_EARNED: 'Всего заработано монет',
  STREAK: 'Серия входов',
};

export const ACHIEVEMENT_CONDITION_OPTIONS = ACHIEVEMENT_CONDITIONS.map(
  (condition) => ACHIEVEMENT_CONDITION_LABELS[condition],
).join(', ');

export const getAchievementConditionLabel = (
  condition: AchievementCondition,
): string => ACHIEVEMENT_CONDITION_LABELS[condition];

export interface AchievementEntity {
  id: string;
  code: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  conditionType: AchievementCondition;
  conditionTypeLabel: string;
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
