import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { SHARED_MESSAGES } from '@org/validation-messages';
import { IsInt, IsOptional, Min } from 'class-validator';

export function Page(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      name: 'page',
      description: 'Номер страницы',
      example: 1,
      minimum: 1,
      required: false,
      type: 'integer',
    }),
    IsOptional(),
    IsInt({ message: SHARED_MESSAGES.PAGINATION_PAGE_VALIDATION.TYPE }),
    Min(1, { message: SHARED_MESSAGES.PAGINATION_PAGE_VALIDATION.MIN }),
  );
}
