import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { GAME_CONFIG } from '@org/validation-config';
import { PET_MESSAGES } from '@org/validation-messages';
import { IsInt, Max, Min } from 'class-validator';

export function WalkClicks(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Количество кликов, накопленных за выгул',
      example: 25,
      type: 'integer',
      minimum: GAME_CONFIG.WALK.CLICKS_MIN,
      maximum: GAME_CONFIG.WALK.CLICKS_MAX,
    }),
    IsInt({ message: PET_MESSAGES.WALK_CLICKS_VALIDATION.TYPE }),
    Min(GAME_CONFIG.WALK.CLICKS_MIN, {
      message: PET_MESSAGES.WALK_CLICKS_VALIDATION.MIN,
    }),
    Max(GAME_CONFIG.WALK.CLICKS_MAX, {
      message: PET_MESSAGES.WALK_CLICKS_VALIDATION.MAX,
    }),
  );
}
