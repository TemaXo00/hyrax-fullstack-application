import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { GAME_CONFIG } from '@org/validation-config';
import { FOOD_MESSAGES } from '@org/validation-messages';
import { IsInt, Max, Min } from 'class-validator';

export function FoodQuantity(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Количество единиц еды для покупки',
      example: 1,
      type: 'integer',
      minimum: GAME_CONFIG.FOOD.QUANTITY_MIN,
      maximum: GAME_CONFIG.FOOD.QUANTITY_MAX,
    }),
    IsInt({ message: FOOD_MESSAGES.QUANTITY_VALIDATION.TYPE }),
    Min(GAME_CONFIG.FOOD.QUANTITY_MIN, {
      message: FOOD_MESSAGES.QUANTITY_VALIDATION.MIN,
    }),
    Max(GAME_CONFIG.FOOD.QUANTITY_MAX, {
      message: FOOD_MESSAGES.QUANTITY_VALIDATION.MAX,
    }),
  );
}
