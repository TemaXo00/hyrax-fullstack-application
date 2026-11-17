import {
  PetAdminHunger,
  PetAdminLevel,
  PetAdminMaxLevel,
  PetAdminMinLevel,
  PetAdminMood,
  PetAdminName,
  PetAdminXp,
  StatisticsAutoIncome,
  StatisticsClickPower,
  StatisticsCoins,
  StatisticsStreak,
  StatisticsTotalClicks,
  StatisticsTotalCoinsEarned,
  StatisticsTotalFeeds,
} from '../decorators/pet/pet-admin.decorators';
import { PaginationDto } from '../shared/pagination.dto';

import type {
  PetAdminFilterInput,
  UpdatePetAdminInput,
  UpdatePlayerStatisticAdminInput,
} from '@org/types';

export class PetAdminQueryDto
  extends PaginationDto
  implements PetAdminFilterInput
{
  @PetAdminMinLevel()
  minLevel?: number;

  @PetAdminMaxLevel()
  maxLevel?: number;
}

export class UpdatePetAdminDto implements UpdatePetAdminInput {
  @PetAdminName()
  name?: string;

  @PetAdminLevel()
  level?: number;

  @PetAdminXp()
  xp?: number;

  @PetAdminHunger()
  hunger?: number;

  @PetAdminMood()
  mood?: number;
}

export class UpdatePlayerStatisticAdminDto implements UpdatePlayerStatisticAdminInput {
  @StatisticsCoins()
  coins?: number;

  @StatisticsTotalCoinsEarned()
  totalCoinsEarned?: number;

  @StatisticsTotalClicks()
  totalClicks?: number;

  @StatisticsTotalFeeds()
  totalFeeds?: number;

  @StatisticsStreak()
  streak?: number;

  @StatisticsClickPower()
  clickPower?: number;

  @StatisticsAutoIncome()
  autoIncome?: number;
}
