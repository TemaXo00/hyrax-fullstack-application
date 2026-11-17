import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ADMIN_CONFIG } from '@org/validation-config';
import { FOOD_MESSAGES } from '@org/validation-messages';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export function FoodAdminName(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Название еды',
      example: 'Морковка',
      type: 'string',
      minLength: ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH,
      maxLength: ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH,
    }),
    IsNotEmpty({ message: FOOD_MESSAGES.NAME_VALIDATION.NOT_EMPTY }),
    IsString({ message: FOOD_MESSAGES.NAME_VALIDATION.TYPE }),
    Length(
      ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH,
      ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH,
      { message: FOOD_MESSAGES.NAME_VALIDATION.LENGTH },
    ),
  );
}

export function FoodAdminDescription(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Описание еды',
      example: 'Хрустящая морковка для повседневного перекуса',
      type: 'string',
      required: false,
      nullable: true,
      maxLength: ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH,
    }),
    IsOptional(),
    IsString({ message: FOOD_MESSAGES.DESCRIPTION_VALIDATION.TYPE }),
    MaxLength(ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH, {
      message: FOOD_MESSAGES.DESCRIPTION_VALIDATION.MAX,
    }),
  );
}

export function FoodAdminPrice(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Цена за одну единицу',
      example: 10,
      type: 'integer',
      minimum: ADMIN_CONFIG.CATALOG.PRICE_MIN,
      maximum: ADMIN_CONFIG.CATALOG.PRICE_MAX,
    }),
    IsInt({ message: FOOD_MESSAGES.PRICE_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.CATALOG.PRICE_MIN, {
      message: FOOD_MESSAGES.PRICE_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.CATALOG.PRICE_MAX, {
      message: FOOD_MESSAGES.PRICE_VALIDATION.MAX,
    }),
  );
}

export function FoodAdminImageUrl(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Ссылка на изображение',
      example: 'https://cdn.hyrax.local/food/carrot.png',
      type: 'string',
      required: false,
      nullable: true,
      maxLength: ADMIN_CONFIG.CATALOG.IMAGE_URL_MAX_LENGTH,
    }),
    IsOptional(),
    IsString({ message: FOOD_MESSAGES.IMAGE_URL_VALIDATION.TYPE }),
    MaxLength(ADMIN_CONFIG.CATALOG.IMAGE_URL_MAX_LENGTH, {
      message: FOOD_MESSAGES.IMAGE_URL_VALIDATION.MAX,
    }),
  );
}

export function FoodAdminIsActive(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Доступна ли еда в магазине',
      example: true,
      type: 'boolean',
      required: false,
    }),
    IsOptional(),
    IsBoolean({ message: FOOD_MESSAGES.IS_ACTIVE_VALIDATION.TYPE }),
  );
}

export function FoodAdminHungerRestore(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Сколько единиц голода восстанавливает',
      example: 15,
      type: 'integer',
      minimum: ADMIN_CONFIG.CATALOG.HUNGER_RESTORE_MIN,
      maximum: ADMIN_CONFIG.CATALOG.HUNGER_RESTORE_MAX,
    }),
    IsInt({ message: FOOD_MESSAGES.HUNGER_RESTORE_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.CATALOG.HUNGER_RESTORE_MIN, {
      message: FOOD_MESSAGES.HUNGER_RESTORE_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.CATALOG.HUNGER_RESTORE_MAX, {
      message: FOOD_MESSAGES.HUNGER_RESTORE_VALIDATION.MAX,
    }),
  );
}

export function FoodAdminMoodBonus(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Сколько единиц настроения добавляет',
      example: 5,
      type: 'integer',
      minimum: ADMIN_CONFIG.CATALOG.MOOD_BONUS_MIN,
      maximum: ADMIN_CONFIG.CATALOG.MOOD_BONUS_MAX,
    }),
    IsInt({ message: FOOD_MESSAGES.MOOD_BONUS_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.CATALOG.MOOD_BONUS_MIN, {
      message: FOOD_MESSAGES.MOOD_BONUS_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.CATALOG.MOOD_BONUS_MAX, {
      message: FOOD_MESSAGES.MOOD_BONUS_VALIDATION.MAX,
    }),
  );
}
