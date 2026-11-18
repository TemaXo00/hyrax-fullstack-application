import { PartialType } from '@nestjs/swagger';

import {
  AchievementCode,
  AchievementConditionType,
  AchievementConditionTypeFilter,
  AchievementConditionValue,
  AchievementDescription,
  AchievementImageUrl,
  AchievementRewardCoins,
  AchievementTitle,
} from '../decorators/achievement/achievement.decorators';
import { PaginationDto } from '../shared/pagination.dto';

import type {
  AchievementCondition,
  AchievementQueryInput,
  CreateAchievementAdminInput,
  UpdateAchievementAdminInput,
} from '@org/types';

export class AchievementQueryDto
  extends PaginationDto
  implements AchievementQueryInput
{
  @AchievementConditionTypeFilter()
  conditionType?: AchievementCondition;
}

export class CreateAchievementAdminDto implements CreateAchievementAdminInput {
  @AchievementCode()
  code: string;

  @AchievementTitle()
  title: string;

  @AchievementDescription()
  description?: string | null;

  @AchievementImageUrl()
  imageUrl?: string | null;

  @AchievementConditionType()
  conditionType: AchievementCondition;

  @AchievementConditionValue()
  conditionValue: number;

  @AchievementRewardCoins()
  rewardCoins?: number;
}

export class UpdateAchievementAdminDto
  extends PartialType(CreateAchievementAdminDto)
  implements UpdateAchievementAdminInput {}
