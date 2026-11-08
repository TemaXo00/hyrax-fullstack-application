import { ApiProperty } from '@nestjs/swagger';
import { COSMETIC_RARITIES, COSMETIC_SLOTS } from '@org/types';

import { PaginationMetaResponseDto } from '../shared/pagination-response.dto';

import type {
  CosmeticEntity,
  CosmeticInventoryEntity,
  CosmeticPurchaseEntity,
  PaginatedCosmeticsOutput,
} from '@org/types';

export class CosmeticResponseDto implements CosmeticEntity {
  @ApiProperty({ description: 'Идентификатор косметики' })
  id: string;

  @ApiProperty({ description: 'Название косметики', example: 'Цилиндр' })
  name: string;

  @ApiProperty({
    description: 'Описание косметики',
    example: 'Элегантный цилиндр для питомца',
    nullable: true,
    required: false,
  })
  description: string | null;

  @ApiProperty({ description: 'Цена', example: 250 })
  price: number;

  @ApiProperty({
    description: 'Ссылка на изображение',
    example: 'https://cdn.hyrax.local/cosmetics/hat.png',
    nullable: true,
    required: false,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Доступна ли косметика в магазине',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Слот экипировки',
    enum: COSMETIC_SLOTS,
    example: 'HAT',
  })
  slot: (typeof COSMETIC_SLOTS)[number];

  @ApiProperty({
    description: 'Русская подпись слота',
    example: 'Головной убор',
  })
  slotLabel: string;

  @ApiProperty({
    description: 'Редкость',
    enum: COSMETIC_RARITIES,
    example: 'RARE',
  })
  rarity: (typeof COSMETIC_RARITIES)[number];

  @ApiProperty({ description: 'Русская подпись редкости', example: 'Редкая' })
  rarityLabel: string;

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

export class CosmeticInventoryResponseDto implements CosmeticInventoryEntity {
  @ApiProperty({ description: 'Идентификатор записи инвентаря' })
  id: string;

  @ApiProperty({ description: 'Экипирована ли косметика', example: false })
  isEquipped: boolean;

  @ApiProperty({ description: 'Косметика', type: CosmeticResponseDto })
  cosmetic: CosmeticResponseDto;

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

export class CosmeticPurchaseResponseDto implements CosmeticPurchaseEntity {
  @ApiProperty({
    description: 'Запись инвентаря после покупки',
    type: CosmeticInventoryResponseDto,
  })
  inventory: CosmeticInventoryResponseDto;

  @ApiProperty({ description: 'Сколько монет потрачено', example: '250' })
  spentCoins: string;

  @ApiProperty({ description: 'Баланс монет после покупки', example: '750' })
  coinsBalance: string;
}

export class PaginatedCosmeticsResponseDto implements PaginatedCosmeticsOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({ description: 'Список косметики', type: [CosmeticResponseDto] })
  cosmetics: CosmeticResponseDto[];
}
