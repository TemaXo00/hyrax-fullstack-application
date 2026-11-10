export interface ApiEnvelope<T> {
  status: 'success' | 'error';
  date: string;
  time: string;
  path?: string;
  data: T;
  duration?: string;
}

export interface ApiErrorEnvelope {
  status: 'error';
  timestamp: string;
  path: string;
  method: string;
  message: string;
  duration?: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Даты приходят с сервера строками, поэтому тип ответа отличается от типа
 * доменной сущности. Утилита рекурсивно заменяет Date на string.
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends Array<infer Item>
    ? Serialized<Item>[]
    : T extends object
      ? { [Key in keyof T]: Serialized<T[Key]> }
      : T;
