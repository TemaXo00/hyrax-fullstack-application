import type { AdminLogAction } from './auth.types.js';
import type {
  PaginationInput,
  PaginationMeta,
} from '../shared/pagination.types.js';

export interface AdminLogUserEntity {
  id: string;
  nickname: string;
}

export interface AdminLogEntity {
  id: string;
  action: AdminLogAction;
  admin: AdminLogUserEntity;
  targetUser: AdminLogUserEntity | null;
  details: unknown | null;
  createdAt: Date;
}

export interface AdminLogQueryInput extends PaginationInput {
  action?: AdminLogAction;
  adminId?: string;
  targetUserId?: string;
}

export interface PaginatedAdminLogsOutput {
  pagination: PaginationMeta;
  logs: AdminLogEntity[];
}
