import { SHARED_CONFIG } from '@org/validation-config';

import type { PaginationInput, PaginationMeta } from '@org/types';

export interface NormalizedPagination {
  page: number;
  limit: number;
  search?: string;
  skip: number;
}

export function normalizePagination(
  input: PaginationInput,
): NormalizedPagination {
  const page = input.page ?? SHARED_CONFIG.PAGINATION.DEFAULT_PAGE;
  const limit = input.limit ?? SHARED_CONFIG.PAGINATION.DEFAULT_LIMIT;
  const search = input.search?.trim();

  return {
    page,
    limit,
    ...(search ? { search } : {}),
    skip: (page - 1) * limit,
  };
}

export function buildPaginationMeta(
  pagination: NormalizedPagination,
  total: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrev: pagination.page > 1,
    ...(pagination.search ? { search: pagination.search } : {}),
  };
}
