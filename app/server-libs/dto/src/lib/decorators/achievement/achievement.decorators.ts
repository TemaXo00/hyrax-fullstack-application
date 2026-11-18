import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ACHIEVEMENT_CONDITIONS } from '@org/types';
import { ACHIEVEMENT_CONFIG } from '@org/validation-config';
import { ACHIEVEMENT_MESSAGES } from '@org/validation-messages';
import {
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

export function AchievementCode(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Уникальный код достижения',
      example: 'FIRST_CLICK',
      type: 'string',
      minLength: ACHIEVEMENT_CONFIG.CODE_MIN_LENGTH,
      maxLength: ACHIEVEMENT_CONFIG.CODE_MAX_LENGTH,
    }),
    IsNotEmpty({ message: ACHIEVEMENT_MESSAGES.CODE_VALIDATION.NOT_EMPTY }),
    IsString({ message: ACHIEVEMENT_MESSAGES.CODE_VALIDATION.TYPE }),
    Length(
      ACHIEVEMENT_CONFIG.CODE_MIN_LENGTH,
      ACHIEVEMENT_CONFIG.CODE_MAX_LENGTH,
      { message: ACHIEVEMENT_MESSAGES.CODE_VALIDATION.LENGTH },
    ),
  );
}

export function AchievementTitle(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Название достижения',
      example: 'Первый клик',
      type: 'string',
      minLength: ACHIEVEMENT_CONFIG.TITLE_MIN_LENGTH,
      maxLength: ACHIEVEMENT_CONFIG.TITLE_MAX_LENGTH,
    }),
    IsNotEmpty({ message: ACHIEVEMENT_MESSAGES.TITLE_VALIDATION.NOT_EMPTY }),
    IsString({ message: ACHIEVEMENT_MESSAGES.TITLE_VALIDATION.TYPE }),
    Length(
      ACHIEVEMENT_CONFIG.TITLE_MIN_LENGTH,
      ACHIEVEMENT_CONFIG.TITLE_MAX_LENGTH,
      { message: ACHIEVEMENT_MESSAGES.TITLE_VALIDATION.LENGTH },
    ),
  );
}

export function AchievementDescription(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Описание достижения',
      example: 'Сделайте первый клик по питомцу',
      type: 'string',
      required: false,
      nullable: true,
      maxLength: ACHIEVEMENT_CONFIG.DESCRIPTION_MAX_LENGTH,
    }),
    IsOptional(),
    IsString({ message: ACHIEVEMENT_MESSAGES.DESCRIPTION_VALIDATION.TYPE }),
    MaxLength(ACHIEVEMENT_CONFIG.DESCRIPTION_MAX_LENGTH, {
      message: ACHIEVEMENT_MESSAGES.DESCRIPTION_VALIDATION.MAX,
    }),
  );
}

export function AchievementImageUrl(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Ссылка на изображение',
      example: 'https://cdn.hyrax.local/achievements/first-click.png',
      type: 'string',
      required: false,
      nullable: true,
      maxLength: ACHIEVEMENT_CONFIG.IMAGE_URL_MAX_LENGTH,
    }),
    IsOptional(),
    IsString({ message: ACHIEVEMENT_MESSAGES.IMAGE_URL_VALIDATION.TYPE }),
    MaxLength(ACHIEVEMENT_CONFIG.IMAGE_URL_MAX_LENGTH, {
      message: ACHIEVEMENT_MESSAGES.IMAGE_URL_VALIDATION.MAX,
    }),
  );
}

export function AchievementConditionType(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Тип условия получения',
      enum: ACHIEVEMENT_CONDITIONS,
      example: 'TOTAL_CLICKS',
    }),
    IsIn([...ACHIEVEMENT_CONDITIONS], {
      message: ACHIEVEMENT_MESSAGES.CONDITION_TYPE_VALIDATION.INVALID,
    }),
  );
}

export function AchievementConditionTypeFilter(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Фильтр по типу условия',
      enum: ACHIEVEMENT_CONDITIONS,
      example: 'TOTAL_CLICKS',
      required: false,
    }),
    IsOptional(),
    IsIn([...ACHIEVEMENT_CONDITIONS], {
      message: ACHIEVEMENT_MESSAGES.CONDITION_TYPE_VALIDATION.INVALID,
    }),
  );
}

export function AchievementConditionValue(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Пороговое значение условия',
      example: 1,
      type: 'integer',
      minimum: ACHIEVEMENT_CONFIG.CONDITION_VALUE_MIN,
      maximum: ACHIEVEMENT_CONFIG.CONDITION_VALUE_MAX,
    }),
    IsInt({ message: ACHIEVEMENT_MESSAGES.CONDITION_VALUE_VALIDATION.TYPE }),
    Min(ACHIEVEMENT_CONFIG.CONDITION_VALUE_MIN, {
      message: ACHIEVEMENT_MESSAGES.CONDITION_VALUE_VALIDATION.MIN,
    }),
    Max(ACHIEVEMENT_CONFIG.CONDITION_VALUE_MAX, {
      message: ACHIEVEMENT_MESSAGES.CONDITION_VALUE_VALIDATION.MAX,
    }),
  );
}

export function AchievementRewardCoins(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Награда в монетах',
      example: 50,
      type: 'integer',
      minimum: ACHIEVEMENT_CONFIG.REWARD_COINS_MIN,
      maximum: ACHIEVEMENT_CONFIG.REWARD_COINS_MAX,
      required: false,
    }),
    IsOptional(),
    IsInt({ message: ACHIEVEMENT_MESSAGES.REWARD_COINS_VALIDATION.TYPE }),
    Min(ACHIEVEMENT_CONFIG.REWARD_COINS_MIN, {
      message: ACHIEVEMENT_MESSAGES.REWARD_COINS_VALIDATION.MIN,
    }),
    Max(ACHIEVEMENT_CONFIG.REWARD_COINS_MAX, {
      message: ACHIEVEMENT_MESSAGES.REWARD_COINS_VALIDATION.MAX,
    }),
  );
}
