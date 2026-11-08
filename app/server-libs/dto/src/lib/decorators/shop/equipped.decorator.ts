import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { COSMETIC_MESSAGES } from '@org/validation-messages';
import { IsBoolean } from 'class-validator';

export function Equipped(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Экипировать или снять косметику',
      example: true,
      type: 'boolean',
    }),
    IsBoolean({ message: COSMETIC_MESSAGES.EQUIPPED_VALIDATION.TYPE }),
  );
}
