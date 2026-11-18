import { ApiProperty } from '@nestjs/swagger';

import { CosmeticResponseDto } from '../cosmetic/cosmetic-response.dto';
import {
  DailyRewardCoins,
  DailyRewardItemId,
} from '../decorators/daily-reward/daily-reward.decorators';

import type {
  DailyRewardClaimEntity,
  DailyRewardEntity,
  DailyRewardStateEntity,
  UpdateDailyRewardAdminInput,
} from '@org/types';

export class DailyRewardResponseDto implements DailyRewardEntity {
  @ApiProperty({ description: 'Идентификатор конфигурации' })
  id: string;

  @ApiProperty({ description: 'Номер дня в цикле', example: 1 })
  dayNumber: number;

  @ApiProperty({ description: 'Награда в монетах', example: 50 })
  rewardCoins: number;

  @ApiProperty({
    description: 'Косметика в награду',
    type: CosmeticResponseDto,
    nullable: true,
    required: false,
  })
  rewardItem: CosmeticResponseDto | null;

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

export class DailyRewardStateResponseDto implements DailyRewardStateEntity {
  @ApiProperty({ description: 'Текущая серия входов', example: 3 })
  currentStreak: number;

  @ApiProperty({ description: 'Лучшая серия входов', example: 7 })
  bestStreak: number;

  @ApiProperty({
    description: 'Дата последней полученной награды',
    type: String,
    format: 'date-time',
    nullable: true,
    required: false,
  })
  lastClaimDate: Date | null;

  @ApiProperty({
    description: 'Можно ли получить награду сегодня',
    example: true,
  })
  canClaim: boolean;

  @ApiProperty({ description: 'Номер дня следующей награды', example: 3 })
  dayNumber: number;

  @ApiProperty({
    description: 'Календарь ежедневных наград',
    type: [DailyRewardResponseDto],
  })
  rewards: DailyRewardResponseDto[];
}

export class DailyRewardClaimResponseDto implements DailyRewardClaimEntity {
  @ApiProperty({ description: 'Номер полученного дня', example: 3 })
  dayNumber: number;

  @ApiProperty({ description: 'Награда в монетах', example: 100 })
  rewardCoins: number;

  @ApiProperty({
    description: 'Косметика в награду',
    type: CosmeticResponseDto,
    nullable: true,
    required: false,
  })
  rewardItem: CosmeticResponseDto | null;

  @ApiProperty({
    description: 'Выдана ли косметика (false, если она уже есть у игрока)',
    example: true,
  })
  itemGranted: boolean;

  @ApiProperty({ description: 'Текущая серия входов', example: 3 })
  currentStreak: number;

  @ApiProperty({ description: 'Лучшая серия входов', example: 7 })
  bestStreak: number;

  @ApiProperty({
    description: 'Дата получения награды',
    type: String,
    format: 'date-time',
  })
  lastClaimDate: Date;

  @ApiProperty({
    description: 'Можно ли получить следующую награду',
    example: false,
  })
  canClaim: boolean;

  @ApiProperty({ description: 'Баланс монет после награды', example: '150' })
  coinsBalance: string;

  @ApiProperty({
    description: 'Всего заработано монет после награды',
    example: '550',
  })
  totalCoinsEarned: string;
}

export class UpdateDailyRewardAdminDto implements UpdateDailyRewardAdminInput {
  @DailyRewardCoins()
  rewardCoins?: number;

  @DailyRewardItemId()
  rewardItemId?: string | null;
}
