import type { UserEntity, UserRole } from './auth.types.js';
import type {
  PaginationInput,
  PaginationMeta,
} from '../shared/pagination.types.js';

export interface UserPaginationInput extends PaginationInput {
  role?: UserRole;
  isBlocked?: boolean;
}

export interface PaginatedUsersOutput {
  pagination: PaginationMeta;
  users: UserEntity[];
}
