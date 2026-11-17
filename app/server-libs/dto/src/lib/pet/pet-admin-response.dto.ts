import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES } from '@org/types';

import { PetResponseDto, PlayerStatisticResponseDto } from './pet-response.dto';
import { PaginationMetaResponseDto } from '../shared/pagination-response.dto';

import type {
  PaginatedPetsAdminOutput,
  PetAdminEntity,
  PetAdminOwnerEntity,
} from '@org/types';

export class PetAdminOwnerResponseDto implements PetAdminOwnerEntity {
  @ApiProperty({ description: 'Идентификатор владельца питомца' })
  id: string;

  @ApiProperty({ description: 'Никнейм владельца питомца', example: 'Игрок' })
  nickname: string;

  @ApiProperty({
    description: 'Роль владельца питомца',
    enum: USER_ROLES,
    example: 'PLAYER',
  })
  role: (typeof USER_ROLES)[number];

  @ApiProperty({ description: 'Русская подпись роли', example: 'Игрок' })
  roleLabel: string;

  @ApiProperty({ description: 'Заблокирован ли владелец', example: false })
  isBlocked: boolean;
}

export class PetAdminResponseDto
  extends PetResponseDto
  implements PetAdminEntity
{
  @ApiProperty({
    description: 'Владелец питомца',
    type: PetAdminOwnerResponseDto,
  })
  owner: PetAdminOwnerResponseDto;

  @ApiProperty({
    description: 'Статистика владельца питомца',
    type: PlayerStatisticResponseDto,
    nullable: true,
  })
  statistics: PlayerStatisticResponseDto | null;
}

export class PaginatedPetsAdminResponseDto implements PaginatedPetsAdminOutput {
  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaResponseDto,
  })
  pagination: PaginationMetaResponseDto;

  @ApiProperty({ description: 'Список питомцев', type: [PetAdminResponseDto] })
  pets: PetAdminResponseDto[];
}
