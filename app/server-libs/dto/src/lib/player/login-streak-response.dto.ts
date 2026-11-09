import { ApiProperty } from '@nestjs/swagger';

import type { LoginStreakEntity } from '@org/types';

export class LoginStreakResponseDto implements LoginStreakEntity {
  @ApiProperty({ description: 'Идентификатор серии входов' })
  id: string;

  @ApiProperty({ description: 'Текущая серия входов', example: 4 })
  currentStreak: number;

  @ApiProperty({ description: 'Лучшая серия входов', example: 9 })
  bestStreak: number;

  @ApiProperty({
    description: 'Дата последнего получения награды',
    type: String,
    format: 'date-time',
  })
  lastClaimDate: Date;

  @ApiProperty({
    description: 'Дата создания',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}
