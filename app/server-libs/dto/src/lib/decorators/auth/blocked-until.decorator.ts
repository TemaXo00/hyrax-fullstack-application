import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { AUTH_ADMIN_MESSAGES } from '@org/validation-messages';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, MinDate } from 'class-validator';

export function BlockedUntil(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Дата и время окончания блокировки',
      example: '2026-09-26T09:00:00.000Z',
      type: 'string',
      format: 'date-time',
    }),
    Type(() => Date),
    IsNotEmpty({
      message: AUTH_ADMIN_MESSAGES.BLOCKED_UNTIL_VALIDATION.NOT_EMPTY,
    }),
    IsDate({ message: AUTH_ADMIN_MESSAGES.BLOCKED_UNTIL_VALIDATION.TYPE }),
    MinDate(() => new Date(), {
      message: AUTH_ADMIN_MESSAGES.BLOCKED_UNTIL_VALIDATION.DATE,
    }),
  );
}
