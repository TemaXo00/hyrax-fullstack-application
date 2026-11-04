import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { AUTH_CONFIG } from '@org/validation-config';
import { AUTH_MESSAGES } from '@org/validation-messages';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export function Nickname(required = true): PropertyDecorator {
  const requiredDecorator = required
    ? IsNotEmpty({ message: AUTH_MESSAGES.NICKNAME_VALIDATION.NOT_EMPTY })
    : IsOptional();

  return applyDecorators(
    ApiProperty({
      description: 'Никнейм пользователя',
      example: 'joe_doe',
      type: 'string',
      required,
      minLength: AUTH_CONFIG.NICKNAME.MIN_LENGTH,
      maxLength: AUTH_CONFIG.NICKNAME.MAX_LENGTH,
    }),
    requiredDecorator,
    IsString({ message: AUTH_MESSAGES.NICKNAME_VALIDATION.TYPE }),
    MinLength(AUTH_CONFIG.NICKNAME.MIN_LENGTH, {
      message: AUTH_MESSAGES.NICKNAME_VALIDATION.MIN_LENGTH,
    }),
    MaxLength(AUTH_CONFIG.NICKNAME.MAX_LENGTH, {
      message: AUTH_MESSAGES.NICKNAME_VALIDATION.MAX_LENGTH,
    }),
  );
}
