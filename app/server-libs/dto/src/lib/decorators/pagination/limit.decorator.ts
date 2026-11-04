import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { SHARED_CONFIG } from '@org/validation-config';
import { SHARED_MESSAGES } from '@org/validation-messages';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export function Limit(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      name: 'limit',
      description: 'Количество записей на странице',
      example: SHARED_CONFIG.PAGINATION.DEFAULT_LIMIT,
      required: false,
      minimum: 1,
      maximum: SHARED_CONFIG.PAGINATION.MAX_LIMIT,
      type: 'integer',
    }),
    IsOptional(),
    IsInt({ message: SHARED_MESSAGES.PAGINATION_LIMIT_VALIDATION.TYPE }),
    Min(1, { message: SHARED_MESSAGES.PAGINATION_LIMIT_VALIDATION.MIN }),
    Max(SHARED_CONFIG.PAGINATION.MAX_LIMIT, {
      message: SHARED_MESSAGES.PAGINATION_LIMIT_VALIDATION.MAX,
    }),
  );
}
