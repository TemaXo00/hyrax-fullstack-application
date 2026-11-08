import { ApiProperty } from '@nestjs/swagger';
import { UPGRADE_EFFECT_TYPES } from '@org/types';

import { PaginationMetaResponseDto } from '../shared/pagination-response.dto';

import type {
  PaginatedUpgradesOutput,
  UpgradeEntity,
  UpgradePurchaseEntity,
  UpgradeShopEntity,
  UserUpgradeEntity,
} from '@org/types';

export class UpgradeResponseDto implements UpgradeEntity {
  @ApiProperty({ description: 'Идентификатор улучшения' })
  id: string;

  @ApiProperty({ description: 'Название улучшения', example: 'Крепкая лапа' })
  name: string;

  @ApiProperty({
    description: 'Описание улучшения',
    example: 'Увеличивает силу клика',
    nullable: true,
    required: false,
  })
  description: string | null;

  @ApiProperty({
    description: 'Ссылка на изображение',
    example: 'https://cdn.hyrax.local/upgrades/paw.png',
    nullable: true,
    required: false,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Тип эффекта',
    enum: UPGRADE_EFFECT_TYPES,
    example: 'CLICK_POWER',
  })
  effectType: (typeof UPGRADE_EFFECT_TYPES)[number];

  @ApiProperty({
    description: 'Русская подпись эффекта',
    example: 'Сила клика',
  })
  effectTypeLabel: string;

  @ApiProperty({ description: 'Значение эффекта за уровень', example: 1 })
  effectValue: number;

  @ApiProperty({ description: 'Базовая цена', example: 100 })
  basePrice: number;

  @ApiProperty({ description: 'Множитель цены за уровень', example: '1.5000' })
  priceMultiplier: string;

  @ApiProperty({ description: 'Максимальный уровень', example: 10 })
  maxLevel: number;

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

export class UpgradeShopResponseDto
  extends UpgradeResponseDto
  implements UpgradeShopEntity
{
  @ApiProperty({ description: 'Текущий уровень игрока', example: 0 })
  ownedLevel: number;

  @ApiProperty({ description: 'Цена следующего уровня', example: 100 })
  nextLevelPrice: number;

  @ApiProperty({
    description: 'Достигнут ли максимальный уровень',
    example: false,
  })
  isMaxLevel: boolean;
}

export class UserUpgradeResponseDto implements UserUpgradeEntity {
  @ApiProperty({ description: 'Идентификатор записи улучшения' })
  id: string;

  @ApiProperty({ description: 'Текущий уровень', example: 1 })
  level: number;

  @ApiProperty({ description: 'Улучшение', type: UpgradeResponseDto })
  upgrade: UpgradeResponseDto;

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

export class UpgradePurchaseResponseDto implements UpgradePurchaseEntity {
  @ApiProperty({
    description: 'Запись улучшения после покупки',
    type: UserUpgradeResponseDto,
  })
  userUpgrade: UserUpgradeResponseDto;

  @ApiProperty({ description: 'Сколько монет потрачено', example: '100' })
  spentCoins: string;

  @ApiProperty({ description: 'Баланс монет после покупки', example: '900' })
  coinsBalance: string;
}

export class PaginatedUpgradesResponseDto implements PaginatedUpgradesOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({
    description: 'Список улучшений',
    type: [UpgradeShopResponseDto],
  })
  upgrades: UpgradeShopResponseDto[];
}
