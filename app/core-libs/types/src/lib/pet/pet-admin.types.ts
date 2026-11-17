import type { PetEntity } from './pet.types.js';
import type { UserRole } from '../auth/auth.types.js';
import type { PlayerStatisticEntity } from '../player/player-statistic.types.js';
import type {
  PaginationInput,
  PaginationMeta,
} from '../shared/pagination.types.js';

export interface PetAdminOwnerEntity {
  id: string;
  nickname: string;
  role: UserRole;
  roleLabel: string;
  isBlocked: boolean;
}

export interface PetAdminEntity extends PetEntity {
  owner: PetAdminOwnerEntity;
  statistics: PlayerStatisticEntity | null;
}

export interface PetAdminFilterInput extends PaginationInput {
  minLevel?: number;
  maxLevel?: number;
}

export interface PaginatedPetsAdminOutput {
  pagination: PaginationMeta;
  pets: PetAdminEntity[];
}

export interface UpdatePetAdminInput {
  name?: string;
  level?: number;
  xp?: number;
  hunger?: number;
  mood?: number;
}

export interface UpdatePlayerStatisticAdminInput {
  coins?: number;
  totalCoinsEarned?: number;
  totalClicks?: number;
  totalFeeds?: number;
  streak?: number;
  clickPower?: number;
  autoIncome?: number;
}

export interface PetAdminServiceContract {
  getPets(pagination: PetAdminFilterInput): Promise<PaginatedPetsAdminOutput>;
  getPetById(petId: string): Promise<PetAdminEntity>;
  updatePet(petId: string, input: UpdatePetAdminInput): Promise<PetAdminEntity>;
  updateStatistics(
    petId: string,
    input: UpdatePlayerStatisticAdminInput,
  ): Promise<PetAdminEntity>;
}
