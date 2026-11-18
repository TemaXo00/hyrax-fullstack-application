import { ApiProperty } from '@nestjs/swagger';
import { ADMIN_LOG_ACTIONS } from '@org/types';

import {
  AdminLogActionFilter,
  AdminLogIdFilter,
} from '../decorators/auth/admin-log.decorators';
import { PaginationMetaResponseDto } from '../shared/pagination-response.dto';
import { PaginationDto } from '../shared/pagination.dto';

import type {
  AdminLogAction,
  AdminLogEntity,
  AdminLogQueryInput,
  AdminLogUserEntity,
  PaginatedAdminLogsOutput,
} from '@org/types';

export class AdminLogQueryDto
  extends PaginationDto
  implements AdminLogQueryInput
{
  @AdminLogActionFilter()
  action?: AdminLogAction;

  @AdminLogIdFilter()
  adminId?: string;

  @AdminLogIdFilter()
  targetUserId?: string;
}

export class AdminLogUserResponseDto implements AdminLogUserEntity {
  @ApiProperty({ description: 'Идентификатор пользователя' })
  id: string;

  @ApiProperty({ description: 'Никнейм пользователя', example: 'joe_doe' })
  nickname: string;
}

export class AdminLogResponseDto implements AdminLogEntity {
  @ApiProperty({ description: 'Идентификатор записи журнала' })
  id: string;

  @ApiProperty({
    description: 'Действие администратора',
    enum: Object.values(ADMIN_LOG_ACTIONS),
    example: ADMIN_LOG_ACTIONS.USER_BLOCKED,
  })
  action: AdminLogAction;

  @ApiProperty({ description: 'Администратор', type: AdminLogUserResponseDto })
  admin: AdminLogUserResponseDto;

  @ApiProperty({
    description: 'Пользователь, к которому применено действие',
    type: AdminLogUserResponseDto,
    nullable: true,
    required: false,
  })
  targetUser: AdminLogUserResponseDto | null;

  @ApiProperty({
    description: 'Детали действия',
    nullable: true,
    required: false,
    example: { blockReason: 'нарушение правил' },
  })
  details: unknown | null;

  @ApiProperty({
    description: 'Дата создания',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;
}

export class PaginatedAdminLogsResponseDto implements PaginatedAdminLogsOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({
    description: 'Записи журнала действий',
    type: [AdminLogResponseDto],
  })
  logs: AdminLogResponseDto[];
}
