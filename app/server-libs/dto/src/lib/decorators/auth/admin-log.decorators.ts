import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ADMIN_LOG_ACTIONS } from '@org/types';
import { AUTH_ADMIN_MESSAGES } from '@org/validation-messages';
import { IsIn, IsOptional, IsString } from 'class-validator';

export function AdminLogActionFilter(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Фильтр по действию администратора',
      enum: Object.values(ADMIN_LOG_ACTIONS),
      example: ADMIN_LOG_ACTIONS.USER_BLOCKED,
      required: false,
    }),
    IsOptional(),
    IsIn(Object.values(ADMIN_LOG_ACTIONS), {
      message: AUTH_ADMIN_MESSAGES.ADMIN_LOG_ACTION_VALIDATION.INVALID,
    }),
  );
}

export function AdminLogIdFilter(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Идентификатор пользователя',
      required: false,
      type: 'string',
    }),
    IsOptional(),
    IsString({ message: AUTH_ADMIN_MESSAGES.ADMIN_LOG_ID_VALIDATION.TYPE }),
  );
}
