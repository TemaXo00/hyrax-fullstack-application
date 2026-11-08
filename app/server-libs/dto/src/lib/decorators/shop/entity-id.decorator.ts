import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { SHOP_MESSAGES } from '@org/validation-messages';
import { IsNotEmpty, IsString } from 'class-validator';

export function EntityId(description: string): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description,
      example: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5c111',
      type: 'string',
    }),
    IsNotEmpty({ message: SHOP_MESSAGES.ID_VALIDATION.NOT_EMPTY }),
    IsString({ message: SHOP_MESSAGES.ID_VALIDATION.TYPE }),
  );
}
