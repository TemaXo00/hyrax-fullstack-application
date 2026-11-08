import { ApiProperty } from '@nestjs/swagger';
import { PET_ACTION_TYPES, PET_MOOD_STATUSES } from '@org/types';

import { CosmeticInventoryResponseDto } from '../cosmetic/cosmetic-response.dto';
import { FoodInventoryResponseDto } from '../food/food-response.dto';
import { UserUpgradeResponseDto } from '../upgrade/upgrade-response.dto';

import type {
  PetActionResultEntity,
  PetDecayEntity,
  PetEntity,
  PetStateEntity,
  PlayerStatisticEntity,
} from '@org/types';

export class PlayerStatisticResponseDto implements PlayerStatisticEntity {
  @ApiProperty({ description: 'Идентификатор статистики' })
  id: string;

  @ApiProperty({ description: 'Баланс монет', example: '1500' })
  coins: string;

  @ApiProperty({ description: 'Всего заработано монет', example: '3200' })
  totalCoinsEarned: string;

  @ApiProperty({ description: 'Всего кликов', example: '420' })
  totalClicks: string;

  @ApiProperty({ description: 'Всего кормлений', example: '18' })
  totalFeeds: string;

  @ApiProperty({ description: 'Серия входов', example: 4 })
  streak: number;

  @ApiProperty({ description: 'Сила клика', example: 3 })
  clickPower: number;

  @ApiProperty({ description: 'Пассивный доход в минуту', example: 2 })
  autoIncome: number;

  @ApiProperty({
    description: 'Дата последней синхронизации',
    type: String,
    format: 'date-time',
  })
  lastSyncAt: Date;

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

export class PetResponseDto implements PetEntity {
  @ApiProperty({ description: 'Идентификатор питомца' })
  id: string;

  @ApiProperty({ description: 'Имя питомца', example: 'Барсик' })
  name: string;

  @ApiProperty({ description: 'Уровень питомца', example: 3 })
  level: number;

  @ApiProperty({ description: 'Текущий опыт', example: 40 })
  xp: number;

  @ApiProperty({ description: 'Опыт до следующего уровня', example: 150 })
  xpToNextLevel: number;

  @ApiProperty({ description: 'Голод', example: 80 })
  hunger: number;

  @ApiProperty({ description: 'Настроение', example: 65 })
  mood: number;

  @ApiProperty({
    description: 'Статус настроения',
    enum: PET_MOOD_STATUSES,
    example: 'NEUTRAL',
  })
  moodStatus: (typeof PET_MOOD_STATUSES)[number];

  @ApiProperty({
    description: 'Русская подпись статуса настроения',
    example: 'Нейтральное настроение',
  })
  moodStatusLabel: string;

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

export class PetDecayResponseDto implements PetDecayEntity {
  @ApiProperty({
    description: 'Сколько настроения теряется в час',
    example: 16.67,
  })
  moodPerHour: number;

  @ApiProperty({ description: 'Сколько голода теряется в час', example: 8.33 })
  hungerPerHour: number;

  @ApiProperty({
    description: 'Когда настроение достигнет нуля',
    type: String,
    format: 'date-time',
  })
  moodZeroAt: Date;

  @ApiProperty({
    description: 'Когда голод достигнет нуля',
    type: String,
    format: 'date-time',
  })
  hungerZeroAt: Date;
}

export class PetStateResponseDto implements PetStateEntity {
  @ApiProperty({ description: 'Питомец', type: PetResponseDto })
  pet: PetResponseDto;

  @ApiProperty({
    description: 'Статистика игрока',
    type: PlayerStatisticResponseDto,
  })
  stats: PlayerStatisticResponseDto;

  @ApiProperty({
    description: 'Инвентарь еды',
    type: [FoodInventoryResponseDto],
  })
  foodInventory: FoodInventoryResponseDto[];

  @ApiProperty({
    description: 'Инвентарь косметики',
    type: [CosmeticInventoryResponseDto],
  })
  cosmeticInventory: CosmeticInventoryResponseDto[];

  @ApiProperty({
    description: 'Улучшения игрока',
    type: [UserUpgradeResponseDto],
  })
  upgrades: UserUpgradeResponseDto[];

  @ApiProperty({
    description: 'Параметры затухания',
    type: PetDecayResponseDto,
  })
  decay: PetDecayResponseDto;

  @ApiProperty({
    description: 'Сколько монет начислено пассивным доходом при этом запросе',
    example: '4',
  })
  autoIncomeCollected: string;

  @ApiProperty({
    description: 'Серверное время',
    type: String,
    format: 'date-time',
  })
  serverTime: Date;
}

export class PetActionResultResponseDto implements PetActionResultEntity {
  @ApiProperty({
    description: 'Тип действия',
    enum: PET_ACTION_TYPES,
    example: 'CLICK',
  })
  action: (typeof PET_ACTION_TYPES)[number];

  @ApiProperty({
    description: 'Русская подпись действия',
    example: 'Клик по питомцу',
  })
  actionLabel: string;

  @ApiProperty({ description: 'Сколько монет заработано', example: '3' })
  coinsEarned: string;

  @ApiProperty({ description: 'Сколько опыта получено', example: 2 })
  xpEarned: number;

  @ApiProperty({ description: 'Баланс монет', example: '1503' })
  coinsBalance: string;

  @ApiProperty({ description: 'Всего кликов', example: '421' })
  totalClicks: string;

  @ApiProperty({ description: 'Всего кормлений', example: '18' })
  totalFeeds: string;

  @ApiProperty({ description: 'Был ли получен новый уровень', example: false })
  leveledUp: boolean;

  @ApiProperty({ description: 'Сколько уровней получено', example: 0 })
  levelsGained: number;

  @ApiProperty({
    description: 'Сколько монет начислено пассивным доходом',
    example: '0',
  })
  autoIncomeCollected: string;

  @ApiProperty({ description: 'Питомец после действия', type: PetResponseDto })
  pet: PetResponseDto;

  @ApiProperty({
    description: 'Статистика после действия',
    type: PlayerStatisticResponseDto,
  })
  stats: PlayerStatisticResponseDto;
}
