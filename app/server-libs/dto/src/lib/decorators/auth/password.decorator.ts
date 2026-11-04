import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { AUTH_CONFIG } from '@org/validation-config';
import { AUTH_MESSAGES } from '@org/validation-messages';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export function Password(required = true): PropertyDecorator {
  const requiredDecorator = required
    ? IsNotEmpty({ message: AUTH_MESSAGES.PASSWORD_VALIDATION.NOT_EMPTY })
    : IsOptional();

  return applyDecorators(
    ApiProperty({
      description: `Пароль. Минимальная длина — ${AUTH_CONFIG.PASSWORD.MIN_LENGTH}, минимум строчных символов — ${AUTH_CONFIG.PASSWORD.MIN_LOWERCASE}, заглавных — ${AUTH_CONFIG.PASSWORD.MIN_UPPERCASE}, цифр — ${AUTH_CONFIG.PASSWORD.MIN_NUMBERS}, символов — ${AUTH_CONFIG.PASSWORD.MIN_SYMBOLS}`,
      example: 'PassW1d1',
      type: 'string',
      required,
    }),
    requiredDecorator,
    IsString({ message: AUTH_MESSAGES.PASSWORD_VALIDATION.TYPE }),
    IsStrongPassword(
      {
        minLength: AUTH_CONFIG.PASSWORD.MIN_LENGTH,
        minLowercase: AUTH_CONFIG.PASSWORD.MIN_LOWERCASE,
        minUppercase: AUTH_CONFIG.PASSWORD.MIN_UPPERCASE,
        minNumbers: AUTH_CONFIG.PASSWORD.MIN_NUMBERS,
        minSymbols: AUTH_CONFIG.PASSWORD.MIN_SYMBOLS,
      },
      {
        message: AUTH_MESSAGES.PASSWORD_VALIDATION.STRONG,
      },
    ),
  );
}
