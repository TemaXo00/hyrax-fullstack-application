import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { AUTH_CONFIG } from '@org/validation-config';
import { AUTH_MESSAGES } from '@org/validation-messages';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export function LocalName(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Отображаемое название сессии',
      example: 'Рабочий ноутбук',
      type: 'string',
      minLength: AUTH_CONFIG.LOCAL_NAME.MIN_LENGTH,
      maxLength: AUTH_CONFIG.LOCAL_NAME.MAX_LENGTH,
    }),
    IsNotEmpty({ message: AUTH_MESSAGES.LOCAL_NAME_VALIDATION.NOT_EMPTY }),
    IsString({ message: AUTH_MESSAGES.LOCAL_NAME_VALIDATION.TYPE }),
    Length(
      AUTH_CONFIG.LOCAL_NAME.MIN_LENGTH,
      AUTH_CONFIG.LOCAL_NAME.MAX_LENGTH,
      {
        message: AUTH_MESSAGES.LOCAL_NAME_VALIDATION.LENGTH,
      },
    ),
  );
}
