import { ApiProperty } from '@nestjs/swagger';
import { ACHIEVEMENT_CONDITIONS } from '@org/types';

import { PaginationMetaResponseDto } from '../shared/pagination-response.dto';

import type {
  AchievementClaimEntity,
  AchievementEntity,
  AchievementProgressEntity,
  PaginatedAchievementCatalogOutput,
  PaginatedAchievementsOutput,
  UserAchievementEntity,
} from '@org/types';

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

export class AchievementProgressResponseDto
  extends AchievementResponseDto
  implements AchievementProgressEntity
{
  @ApiProperty({ description: 'Текущий прогресс', example: 3 })
  progress: number;

  @ApiProperty({
    description: 'Выполнено ли условие получения',
    example: true,
  })
  isUnlocked: boolean;

  @ApiProperty({ description: 'Получено ли достижение', example: false })
  isClaimed: boolean;

  @ApiProperty({
    description: 'Дата получения достижения',
    type: String,
    format: 'date-time',
    nullable: true,
    required: false,
  })
  claimedAt: Date | null;
}

export class PaginatedAchievementsResponseDto implements PaginatedAchievementsOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({
    description: 'Список достижений с прогрессом',
    type: [AchievementProgressResponseDto],
  })
  achievements: AchievementProgressResponseDto[];
}

export class PaginatedAchievementCatalogResponseDto implements PaginatedAchievementCatalogOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({
    description: 'Список достижений',
    type: [AchievementResponseDto],
  })
  achievements: AchievementResponseDto[];
}

export class AchievementClaimResponseDto implements AchievementClaimEntity {
  @ApiProperty({
    description: 'Полученное достижение',
    type: AchievementProgressResponseDto,
  })
  achievement: AchievementProgressResponseDto;

  @ApiProperty({ description: 'Награда в монетах', example: '50' })
  rewardCoins: number;

  @ApiProperty({ description: 'Баланс монет после награды', example: '150' })
  coinsBalance: string;

  @ApiProperty({
    description: 'Всего заработано монет после награды',
    example: '550',
  })
  totalCoinsEarned: string;
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
