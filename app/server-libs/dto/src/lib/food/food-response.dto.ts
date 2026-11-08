import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaResponseDto } from '../shared/pagination-response.dto';

import type {
  FoodEntity,
  FoodInventoryEntity,
  FoodPurchaseEntity,
  PaginatedFoodsOutput,
} from '@org/types';

export class FoodResponseDto implements FoodEntity {
  @ApiProperty({ description: 'Идентификатор еды' })
  id: string;

  @ApiProperty({ description: 'Название еды', example: 'Морковка' })
  name: string;

  @ApiProperty({
    description: 'Описание еды',
    example: 'Хрустящая морковка',
    nullable: true,
    required: false,
  })
  description: string | null;

  @ApiProperty({ description: 'Цена за одну единицу', example: 10 })
  price: number;

  @ApiProperty({
    description: 'Ссылка на изображение',
    example: 'https://cdn.hyrax.local/food/carrot.png',
    nullable: true,
    required: false,
  })
  imageUrl: string | null;

  @ApiProperty({ description: 'Доступна ли еда в магазине', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Сколько единиц голода восстанавливает',
    example: 15,
  })
  hungerRestore: number;

  @ApiProperty({
    description: 'Сколько единиц настроения добавляет',
    example: 5,
  })
  moodBonus: number;

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

export class FoodInventoryResponseDto implements FoodInventoryEntity {
  @ApiProperty({ description: 'Идентификатор записи инвентаря' })
  id: string;

  @ApiProperty({ description: 'Количество единиц еды', example: 3 })
  quantity: number;

  @ApiProperty({ description: 'Еда', type: FoodResponseDto })
  food: FoodResponseDto;

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

export class FoodPurchaseResponseDto implements FoodPurchaseEntity {
  @ApiProperty({
    description: 'Запись инвентаря после покупки',
    type: FoodInventoryResponseDto,
  })
  inventory: FoodInventoryResponseDto;

  @ApiProperty({ description: 'Сколько монет потрачено', example: '30' })
  spentCoins: string;

  @ApiProperty({ description: 'Баланс монет после покупки', example: '970' })
  coinsBalance: string;
}

export class PaginatedFoodsResponseDto implements PaginatedFoodsOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({ description: 'Список еды', type: [FoodResponseDto] })
  foods: FoodResponseDto[];
}
