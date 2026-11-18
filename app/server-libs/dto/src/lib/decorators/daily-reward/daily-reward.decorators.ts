import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DAILY_REWARD_CONFIG } from '@org/validation-config';
import { DAILY_REWARD_MESSAGES } from '@org/validation-messages';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export function DailyRewardDayNumber(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Номер дня в цикле ежедневных наград',
      example: 1,
      type: 'integer',
      minimum: DAILY_REWARD_CONFIG.DAY_MIN,
      maximum: DAILY_REWARD_CONFIG.DAY_MAX,
    }),
    IsInt({ message: DAILY_REWARD_MESSAGES.DAY_VALIDATION.TYPE }),
    Min(DAILY_REWARD_CONFIG.DAY_MIN, {
      message: DAILY_REWARD_MESSAGES.DAY_VALIDATION.MIN,
    }),
    Max(DAILY_REWARD_CONFIG.DAY_MAX, {
      message: DAILY_REWARD_MESSAGES.DAY_VALIDATION.MAX,
    }),
  );
}

export function DailyRewardCoins(): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      description: 'Награда в монетах',
      example: 50,
      type: 'integer',
      minimum: DAILY_REWARD_CONFIG.REWARD_COINS_MIN,
      maximum: DAILY_REWARD_CONFIG.REWARD_COINS_MAX,
    }),
    IsOptional(),
    IsInt({ message: DAILY_REWARD_MESSAGES.REWARD_COINS_VALIDATION.TYPE }),
    Min(DAILY_REWARD_CONFIG.REWARD_COINS_MIN, {
      message: DAILY_REWARD_MESSAGES.REWARD_COINS_VALIDATION.MIN,
    }),
    Max(DAILY_REWARD_CONFIG.REWARD_COINS_MAX, {
      message: DAILY_REWARD_MESSAGES.REWARD_COINS_VALIDATION.MAX,
    }),
  );
}

export function DailyRewardItemId(): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      description: 'Идентификатор косметики в награду',
      example: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d001',
      type: 'string',
      nullable: true,
    }),
    ValidateIf((_object, value) => value !== null && value !== undefined),
    IsString({ message: DAILY_REWARD_MESSAGES.REWARD_ITEM_VALIDATION.TYPE }),
  );
}
