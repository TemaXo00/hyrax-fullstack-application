import { ApiProperty } from '@nestjs/swagger';
import { ACHIEVEMENT_CONDITIONS } from '@org/types';

import type { AchievementEntity, UserAchievementEntity } from '@org/types';

export class AchievementResponseDto implements AchievementEntity {
  @ApiProperty({ description: 'Идентификатор достижения' })
  id: string;

  @ApiProperty({ description: 'Код достижения', example: 'FIRST_CLICK' })
  code: string;

  @ApiProperty({ description: 'Название достижения', example: 'Первый клик' })
  title: string;

  @ApiProperty({
    description: 'Описание достижения',
    nullable: true,
    required: false,
  })
  description: string | null;

  @ApiProperty({
    description: 'Ссылка на изображение',
    nullable: true,
    required: false,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Тип условия получения',
    enum: ACHIEVEMENT_CONDITIONS,
    example: 'TOTAL_CLICKS',
  })
  conditionType: (typeof ACHIEVEMENT_CONDITIONS)[number];

  @ApiProperty({
    description: 'Русская подпись условия',
    example: 'Всего кликов',
  })
  conditionTypeLabel: string;

  @ApiProperty({ description: 'Значение условия', example: 1 })
  conditionValue: number;

  @ApiProperty({ description: 'Награда в монетах', example: 100 })
  rewardCoins: number;

  @ApiProperty({
    description: 'Дата создания',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}

export class UserAchievementResponseDto implements UserAchievementEntity {
  @ApiProperty({ description: 'Идентификатор записи достижения' })
  id: string;

  @ApiProperty({ description: 'Достижение', type: AchievementResponseDto })
  achievement: AchievementResponseDto;

  @ApiProperty({
    description: 'Дата получения',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;
}
