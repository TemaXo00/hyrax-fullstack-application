import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ADMIN_CONFIG, GAME_CONFIG } from '@org/validation-config';
import { PET_MESSAGES } from '@org/validation-messages';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

interface StatisticNumberOptions {
  description: string;
  example: number;
  min: number;
  max: number;
  messages: {
    TYPE: string;
    MIN: string;
    MAX: string;
  };
}

function StatisticNumber(options: StatisticNumberOptions): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: options.description,
      example: options.example,
      type: 'integer',
      minimum: options.min,
      maximum: options.max,
      required: false,
    }),
    IsOptional(),
    IsInt({ message: options.messages.TYPE }),
    Min(options.min, { message: options.messages.MIN }),
    Max(options.max, { message: options.messages.MAX }),
  );
}

export function PetAdminName(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Имя питомца',
      example: 'Барсик',
      type: 'string',
      minLength: GAME_CONFIG.PET.NAME_MIN_LENGTH,
      maxLength: GAME_CONFIG.PET.NAME_MAX_LENGTH,
      required: false,
    }),
    IsOptional(),
    IsString({ message: PET_MESSAGES.NAME_VALIDATION.TYPE }),
    Length(GAME_CONFIG.PET.NAME_MIN_LENGTH, GAME_CONFIG.PET.NAME_MAX_LENGTH, {
      message: PET_MESSAGES.NAME_VALIDATION.LENGTH,
    }),
  );
}

export function PetAdminLevel(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Уровень питомца',
      example: 3,
      type: 'integer',
      minimum: ADMIN_CONFIG.PET.LEVEL_MIN,
      maximum: ADMIN_CONFIG.PET.LEVEL_MAX,
      required: false,
    }),
    IsOptional(),
    IsInt({ message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.PET.LEVEL_MIN, {
      message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.PET.LEVEL_MAX, {
      message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.MAX,
    }),
  );
}

export function PetAdminXp(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Текущий опыт питомца',
      example: 40,
      type: 'integer',
      minimum: ADMIN_CONFIG.PET.XP_MIN,
      maximum: ADMIN_CONFIG.PET.XP_MAX,
      required: false,
    }),
    IsOptional(),
    IsInt({ message: PET_MESSAGES.ADMIN_XP_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.PET.XP_MIN, {
      message: PET_MESSAGES.ADMIN_XP_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.PET.XP_MAX, {
      message: PET_MESSAGES.ADMIN_XP_VALIDATION.MAX,
    }),
  );
}

export function PetAdminHunger(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Голод питомца',
      example: 80,
      type: 'integer',
      minimum: GAME_CONFIG.PET.HUNGER_MIN,
      maximum: GAME_CONFIG.PET.HUNGER_MAX,
      required: false,
    }),
    IsOptional(),
    IsInt({ message: PET_MESSAGES.HUNGER_VALIDATION.TYPE }),
    Min(GAME_CONFIG.PET.HUNGER_MIN, {
      message: PET_MESSAGES.HUNGER_VALIDATION.RANGE,
    }),
    Max(GAME_CONFIG.PET.HUNGER_MAX, {
      message: PET_MESSAGES.HUNGER_VALIDATION.RANGE,
    }),
  );
}

export function PetAdminMood(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Настроение питомца',
      example: 65,
      type: 'integer',
      minimum: GAME_CONFIG.PET.MOOD_MIN,
      maximum: GAME_CONFIG.PET.MOOD_MAX,
      required: false,
    }),
    IsOptional(),
    IsInt({ message: PET_MESSAGES.MOOD_VALIDATION.TYPE }),
    Min(GAME_CONFIG.PET.MOOD_MIN, {
      message: PET_MESSAGES.MOOD_VALIDATION.RANGE,
    }),
    Max(GAME_CONFIG.PET.MOOD_MAX, {
      message: PET_MESSAGES.MOOD_VALIDATION.RANGE,
    }),
  );
}

export function PetAdminMinLevel(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Минимальный уровень питомца',
      example: 1,
      type: 'integer',
      minimum: ADMIN_CONFIG.PET.LEVEL_MIN,
      maximum: ADMIN_CONFIG.PET.LEVEL_MAX,
      required: false,
    }),
    IsOptional(),
    IsInt({ message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.PET.LEVEL_MIN, {
      message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.PET.LEVEL_MAX, {
      message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.MAX,
    }),
  );
}

export function PetAdminMaxLevel(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Максимальный уровень питомца',
      example: 100,
      type: 'integer',
      minimum: ADMIN_CONFIG.PET.LEVEL_MIN,
      maximum: ADMIN_CONFIG.PET.LEVEL_MAX,
      required: false,
    }),
    IsOptional(),
    IsInt({ message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.TYPE }),
    Min(ADMIN_CONFIG.PET.LEVEL_MIN, {
      message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.MIN,
    }),
    Max(ADMIN_CONFIG.PET.LEVEL_MAX, {
      message: PET_MESSAGES.ADMIN_LEVEL_VALIDATION.MAX,
    }),
  );
}

export function StatisticsCoins(): PropertyDecorator {
  return StatisticNumber({
    description: 'Баланс монет',
    example: 1500,
    min: ADMIN_CONFIG.STATISTICS.COUNT_MIN,
    max: ADMIN_CONFIG.STATISTICS.COUNT_MAX,
    messages: PET_MESSAGES.ADMIN_STATISTICS_VALIDATION.COINS,
  });
}

export function StatisticsTotalCoinsEarned(): PropertyDecorator {
  return StatisticNumber({
    description: 'Всего заработано монет',
    example: 3200,
    min: ADMIN_CONFIG.STATISTICS.COUNT_MIN,
    max: ADMIN_CONFIG.STATISTICS.COUNT_MAX,
    messages: PET_MESSAGES.ADMIN_STATISTICS_VALIDATION.TOTAL_COINS_EARNED,
  });
}

export function StatisticsTotalClicks(): PropertyDecorator {
  return StatisticNumber({
    description: 'Всего кликов',
    example: 420,
    min: ADMIN_CONFIG.STATISTICS.COUNT_MIN,
    max: ADMIN_CONFIG.STATISTICS.COUNT_MAX,
    messages: PET_MESSAGES.ADMIN_STATISTICS_VALIDATION.TOTAL_CLICKS,
  });
}

export function StatisticsTotalFeeds(): PropertyDecorator {
  return StatisticNumber({
    description: 'Всего кормлений',
    example: 18,
    min: ADMIN_CONFIG.STATISTICS.COUNT_MIN,
    max: ADMIN_CONFIG.STATISTICS.COUNT_MAX,
    messages: PET_MESSAGES.ADMIN_STATISTICS_VALIDATION.TOTAL_FEEDS,
  });
}

export function StatisticsStreak(): PropertyDecorator {
  return StatisticNumber({
    description: 'Серия входов',
    example: 4,
    min: ADMIN_CONFIG.STATISTICS.STREAK_MIN,
    max: ADMIN_CONFIG.STATISTICS.STREAK_MAX,
    messages: PET_MESSAGES.ADMIN_STATISTICS_VALIDATION.STREAK,
  });
}

export function StatisticsClickPower(): PropertyDecorator {
  return StatisticNumber({
    description: 'Сила клика',
    example: 3,
    min: ADMIN_CONFIG.STATISTICS.CLICK_POWER_MIN,
    max: ADMIN_CONFIG.STATISTICS.CLICK_POWER_MAX,
    messages: PET_MESSAGES.ADMIN_STATISTICS_VALIDATION.CLICK_POWER,
  });
}

export function StatisticsAutoIncome(): PropertyDecorator {
  return StatisticNumber({
    description: 'Пассивный доход в минуту',
    example: 2,
    min: ADMIN_CONFIG.STATISTICS.AUTO_INCOME_MIN,
    max: ADMIN_CONFIG.STATISTICS.AUTO_INCOME_MAX,
    messages: PET_MESSAGES.ADMIN_STATISTICS_VALIDATION.AUTO_INCOME,
  });
}
