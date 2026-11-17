import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { COSMETIC_RARITIES, COSMETIC_SLOTS } from '@org/types';
import { ADMIN_CONFIG } from '@org/validation-config';
import { COSMETIC_MESSAGES } from '@org/validation-messages';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export function CosmeticAdminName(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Название косметики',
      example: 'Цилиндр',
      type: 'string',
      minLength: ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH,
      maxLength: ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH,
    }),
    IsNotEmpty({ message: COSMETIC_MESSAGES.NAME_VALIDATION.NOT_EMPTY }),
    IsString({ message: COSMETIC_MESSAGES.NAME_VALIDATION.TYPE }),
    Length(
      ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH,
      ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH,
      { message: COSMETIC_MESSAGES.NAME_VALIDATION.LENGTH },
    ),
  );
}

export function CosmeticAdminDescription(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Описание косметики',
      example: 'Элегантный цилиндр для питомца',
      type: 'string',
      required: false,
      nullable: true,
      maxLength: ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH,
    }),
    IsOptional(),
    IsString({ message: COSMETIC_MESSAGES.DESCRIPTION_VALIDATION.TYPE }),
    MaxLength(ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH, {
      message: COSMETIC_MESSAGES.DESCRIPTION_VALIDATION.MAX,
    }),
  );
}

export function CosmeticAdminPrice(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Цена',
      example: 250,
      type: 'integer',
      minimum: ADMIN_CONFIG.CATALOG.PRICE_MIN,
      maximum: ADMIN_CONFIG.CATALOG.PRICE_MAX,
    }),
    IsInt({ message: COSMETIC_MESSAGES.PRICE_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.CATALOG.PRICE_MIN, {
      message: COSMETIC_MESSAGES.PRICE_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.CATALOG.PRICE_MAX, {
      message: COSMETIC_MESSAGES.PRICE_VALIDATION.MAX,
    }),
  );
}

export function CosmeticAdminImageUrl(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Ссылка на изображение',
      example: 'https://cdn.hyrax.local/cosmetics/hat.png',
      type: 'string',
      required: false,
      nullable: true,
      maxLength: ADMIN_CONFIG.CATALOG.IMAGE_URL_MAX_LENGTH,
    }),
    IsOptional(),
    IsString({ message: COSMETIC_MESSAGES.IMAGE_URL_VALIDATION.TYPE }),
    MaxLength(ADMIN_CONFIG.CATALOG.IMAGE_URL_MAX_LENGTH, {
      message: COSMETIC_MESSAGES.IMAGE_URL_VALIDATION.MAX,
    }),
  );
}

export function CosmeticAdminIsActive(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Доступна ли косметика в магазине',
      example: true,
      type: 'boolean',
      required: false,
    }),
    IsOptional(),
    IsBoolean({ message: COSMETIC_MESSAGES.IS_ACTIVE_VALIDATION.TYPE }),
  );
}

export function CosmeticAdminSlot(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Слот экипировки',
      enum: COSMETIC_SLOTS,
      example: 'HAT',
    }),
    IsNotEmpty({ message: COSMETIC_MESSAGES.SLOT_VALIDATION.NOT_EMPTY }),
    IsIn([...COSMETIC_SLOTS], {
      message: COSMETIC_MESSAGES.SLOT_VALIDATION.INVALID,
    }),
  );
}

export function CosmeticAdminRarity(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Редкость',
      enum: COSMETIC_RARITIES,
      example: 'RARE',
    }),
    IsNotEmpty({ message: COSMETIC_MESSAGES.RARITY_VALIDATION.NOT_EMPTY }),
    IsIn([...COSMETIC_RARITIES], {
      message: COSMETIC_MESSAGES.RARITY_VALIDATION.INVALID,
    }),
  );
}
