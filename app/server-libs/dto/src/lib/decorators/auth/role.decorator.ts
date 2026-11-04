import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES } from '@org/types';
import { AUTH_ADMIN_MESSAGES } from '@org/validation-messages';
import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export function Role(required = true): PropertyDecorator {
  const requiredDecorator = required
    ? IsNotEmpty({ message: AUTH_ADMIN_MESSAGES.ROLE_VALIDATION.NOT_EMPTY })
    : IsOptional();

  return applyDecorators(
    ApiProperty({
      description: 'Роль пользователя',
      required,
      enum: USER_ROLES,
      example: 'PLAYER',
    }),
    requiredDecorator,
    IsIn([...USER_ROLES], {
      message: AUTH_ADMIN_MESSAGES.ROLE_VALIDATION.INVALID,
    }),
  );
}
