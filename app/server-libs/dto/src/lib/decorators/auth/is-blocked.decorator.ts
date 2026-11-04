import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { SHARED_MESSAGES } from '@org/validation-messages';
import { IsBoolean, IsOptional } from 'class-validator';

export function IsBlocked(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Фильтр пользователей по состоянию блокировки',
      required: false,
      type: 'boolean',
      example: false,
    }),
    IsOptional(),
    IsBoolean({
      message: SHARED_MESSAGES.PAGINATION_IS_BLOCKED_VALIDATION.TYPE,
    }),
  );
}
