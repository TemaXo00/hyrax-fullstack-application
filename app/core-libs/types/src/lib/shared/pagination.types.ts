export interface PaginationInput {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search?: string;
}

export interface PaginatedResult<T> {
  pagination: PaginationMeta;
  items: T[];
}
