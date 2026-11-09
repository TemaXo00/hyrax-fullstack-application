import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES } from '@org/types';

import { UserAchievementResponseDto } from '../achievement/achievement-response.dto';
import { CosmeticInventoryResponseDto } from '../cosmetic/cosmetic-response.dto';
import { FoodInventoryResponseDto } from '../food/food-response.dto';
import {
  PetResponseDto,
  PlayerStatisticResponseDto,
} from '../pet/pet-response.dto';
import { LoginStreakResponseDto } from '../player/login-streak-response.dto';
import { PaginationMetaResponseDto } from '../shared/pagination-response.dto';
import { UserUpgradeResponseDto } from '../upgrade/upgrade-response.dto';

import type {
  AuthResponse,
  MeEntity,
  PaginatedUsersOutput,
  SessionEntity,
  UserEntity,
  UserRole,
} from '@org/types';

export class UserResponseDto implements UserEntity {
  @ApiProperty({ description: 'Идентификатор пользователя' })
  id: string;

  @ApiProperty({ description: 'Никнейм', example: 'hyrax_player' })
  nickname: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: USER_ROLES,
    example: 'PLAYER',
  })
  role: UserRole;

  @ApiProperty({ description: 'Русская подпись роли', example: 'Игрок' })
  roleLabel: string;

  @ApiProperty({ description: 'Заблокирован ли пользователь', example: false })
  isBlocked: boolean;

  @ApiProperty({
    description: 'Дата окончания блокировки',
    type: String,
    format: 'date-time',
    nullable: true,
    required: false,
  })
  blockedUntil: Date | null;

  @ApiProperty({
    description: 'Причина блокировки',
    nullable: true,
    required: false,
  })
  blockReason: string | null;

  @ApiProperty({
    description: 'Дата регистрации',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата последнего входа',
    type: String,
    format: 'date-time',
  })
  lastLoginAt: Date;
}

export class AuthResponseDto implements AuthResponse {
  @ApiProperty({
    description: 'Access-токен для авторизации запросов',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ description: 'Пользователь', type: UserResponseDto })
  user: UserResponseDto;
}

export class SessionResponseDto implements SessionEntity {
  @ApiProperty({ description: 'Идентификатор сессии' })
  id: string;

  @ApiProperty({
    description: 'Локальное название сессии',
    nullable: true,
    required: false,
  })
  localName: string | null;

  @ApiProperty({ description: 'IP-адрес сессии', example: '127.0.0.1' })
  ip: string;

  @ApiProperty({
    description: 'User-Agent сессии',
    example: 'Mozilla/5.0',
  })
  userAgent: string;

  @ApiProperty({
    description: 'Является ли сессия текущей',
    example: true,
  })
  isCurrent: boolean;

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

export class MeResponseDto extends UserResponseDto implements MeEntity {
  @ApiProperty({
    description: 'Питомец пользователя',
    type: PetResponseDto,
    nullable: true,
    required: false,
  })
  pet: PetResponseDto | null;

  @ApiProperty({
    description: 'Статистика игрока',
    type: PlayerStatisticResponseDto,
    nullable: true,
    required: false,
  })
  stats: PlayerStatisticResponseDto | null;

  @ApiProperty({
    description: 'Серия входов',
    type: LoginStreakResponseDto,
    nullable: true,
    required: false,
  })
  streak: LoginStreakResponseDto | null;

  @ApiProperty({
    description: 'Инвентарь еды',
    type: [FoodInventoryResponseDto],
  })
  foodInventory: FoodInventoryResponseDto[];

  @ApiProperty({
    description: 'Инвентарь косметики',
    type: [CosmeticInventoryResponseDto],
  })
  cosmeticInventory: CosmeticInventoryResponseDto[];

  @ApiProperty({
    description: 'Улучшения пользователя',
    type: [UserUpgradeResponseDto],
  })
  upgrades: UserUpgradeResponseDto[];

  @ApiProperty({
    description: 'Достижения пользователя',
    type: [UserAchievementResponseDto],
  })
  achievements: UserAchievementResponseDto[];
}

export class PaginatedUsersResponseDto implements PaginatedUsersOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({ description: 'Список пользователей', type: [UserResponseDto] })
  users: UserResponseDto[];
}
