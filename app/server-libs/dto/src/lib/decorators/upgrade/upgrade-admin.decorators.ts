import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { UPGRADE_EFFECT_TYPES } from '@org/types';
import { ADMIN_CONFIG } from '@org/validation-config';
import { UPGRADE_MESSAGES } from '@org/validation-messages';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export function UpgradeAdminName(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Название улучшения',
      example: 'Крепкая лапа',
      type: 'string',
      minLength: ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH,
      maxLength: ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH,
    }),
    IsNotEmpty({ message: UPGRADE_MESSAGES.NAME_VALIDATION.NOT_EMPTY }),
    IsString({ message: UPGRADE_MESSAGES.NAME_VALIDATION.TYPE }),
    Length(
      ADMIN_CONFIG.CATALOG.NAME_MIN_LENGTH,
      ADMIN_CONFIG.CATALOG.NAME_MAX_LENGTH,
      { message: UPGRADE_MESSAGES.NAME_VALIDATION.LENGTH },
    ),
  );
}

export function UpgradeAdminDescription(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Описание улучшения',
      example: 'Увеличивает силу клика на 1 за уровень',
      type: 'string',
      required: false,
      nullable: true,
      maxLength: ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH,
    }),
    IsOptional(),
    IsString({ message: UPGRADE_MESSAGES.DESCRIPTION_VALIDATION.TYPE }),
    MaxLength(ADMIN_CONFIG.CATALOG.DESCRIPTION_MAX_LENGTH, {
      message: UPGRADE_MESSAGES.DESCRIPTION_VALIDATION.MAX,
    }),
  );
}

export function UpgradeAdminImageUrl(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Ссылка на изображение',
      example: 'https://cdn.hyrax.local/upgrades/paw.png',
      type: 'string',
      required: false,
      nullable: true,
      maxLength: ADMIN_CONFIG.CATALOG.IMAGE_URL_MAX_LENGTH,
    }),
    IsOptional(),
    IsString({ message: UPGRADE_MESSAGES.IMAGE_URL_VALIDATION.TYPE }),
    MaxLength(ADMIN_CONFIG.CATALOG.IMAGE_URL_MAX_LENGTH, {
      message: UPGRADE_MESSAGES.IMAGE_URL_VALIDATION.MAX,
    }),
  );
}

export function UpgradeAdminEffectType(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Тип эффекта',
      enum: UPGRADE_EFFECT_TYPES,
      example: 'CLICK_POWER',
    }),
    IsNotEmpty({
      message: UPGRADE_MESSAGES.EFFECT_TYPE_VALIDATION.NOT_EMPTY,
    }),
    IsIn([...UPGRADE_EFFECT_TYPES], {
      message: UPGRADE_MESSAGES.EFFECT_TYPE_VALIDATION.INVALID,
    }),
  );
}

export function UpgradeAdminEffectValue(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Значение эффекта за уровень',
      example: 1,
      type: 'integer',
      minimum: ADMIN_CONFIG.CATALOG.EFFECT_VALUE_MIN,
      maximum: ADMIN_CONFIG.CATALOG.EFFECT_VALUE_MAX,
    }),
    IsInt({ message: UPGRADE_MESSAGES.EFFECT_VALUE_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.CATALOG.EFFECT_VALUE_MIN, {
      message: UPGRADE_MESSAGES.EFFECT_VALUE_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.CATALOG.EFFECT_VALUE_MAX, {
      message: UPGRADE_MESSAGES.EFFECT_VALUE_VALIDATION.MAX,
    }),
  );
}

export function UpgradeAdminBasePrice(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Базовая цена',
      example: 100,
      type: 'integer',
      minimum: ADMIN_CONFIG.CATALOG.PRICE_MIN,
      maximum: ADMIN_CONFIG.CATALOG.PRICE_MAX,
    }),
    IsInt({ message: UPGRADE_MESSAGES.BASE_PRICE_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.CATALOG.PRICE_MIN, {
      message: UPGRADE_MESSAGES.BASE_PRICE_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.CATALOG.PRICE_MAX, {
      message: UPGRADE_MESSAGES.BASE_PRICE_VALIDATION.MAX,
    }),
  );
}

export function UpgradeAdminPriceMultiplier(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Множитель цены за уровень',
      example: 1.5,
      type: 'number',
      minimum: ADMIN_CONFIG.CATALOG.PRICE_MULTIPLIER_MIN,
      maximum: ADMIN_CONFIG.CATALOG.PRICE_MULTIPLIER_MAX,
    }),
    IsNumber(
      {},
      { message: UPGRADE_MESSAGES.PRICE_MULTIPLIER_VALIDATION.TYPE },
    ),
    Min(ADMIN_CONFIG.CATALOG.PRICE_MULTIPLIER_MIN, {
      message: UPGRADE_MESSAGES.PRICE_MULTIPLIER_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.CATALOG.PRICE_MULTIPLIER_MAX, {
      message: UPGRADE_MESSAGES.PRICE_MULTIPLIER_VALIDATION.MAX,
    }),
  );
}

export function UpgradeAdminMaxLevel(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Максимальный уровень',
      example: 10,
      type: 'integer',
      minimum: ADMIN_CONFIG.CATALOG.MAX_LEVEL_MIN,
      maximum: ADMIN_CONFIG.CATALOG.MAX_LEVEL_MAX,
    }),
    IsInt({ message: UPGRADE_MESSAGES.MAX_LEVEL_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.CATALOG.MAX_LEVEL_MIN, {
      message: UPGRADE_MESSAGES.MAX_LEVEL_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.CATALOG.MAX_LEVEL_MAX, {
      message: UPGRADE_MESSAGES.MAX_LEVEL_VALIDATION.MAX,
    }),
  );
}
