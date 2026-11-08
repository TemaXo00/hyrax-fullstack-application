import { ApiProperty } from '@nestjs/swagger';

import type { PaginationMeta } from '@org/types';

export class PaginationMetaResponseDto implements PaginationMeta {
  @ApiProperty({ description: 'Текущая страница', example: 1 })
  page: number;

  @ApiProperty({ description: 'Количество записей на странице', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Общее количество записей', example: 42 })
  total: number;

  @ApiProperty({ description: 'Общее количество страниц', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Есть ли следующая страница', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Есть ли предыдущая страница', example: false })
  hasPrev: boolean;

  @ApiProperty({
    description: 'Строка поиска',
    example: 'корм',
    required: false,
  })
  search?: string;
}
