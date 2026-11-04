import { SHARED_CONFIG } from '@org/validation-config';

import { Limit } from '../decorators/pagination/limit.decorator';
import { Page } from '../decorators/pagination/page.decorator';
import { Search } from '../decorators/pagination/search.decorator';

import type { PaginationInput } from '@org/types';

export class PaginationDto implements PaginationInput {
  @Page()
  page?: number = SHARED_CONFIG.PAGINATION.DEFAULT_PAGE;

  @Limit()
  limit?: number = SHARED_CONFIG.PAGINATION.DEFAULT_LIMIT;

  @Search()
  search?: string;
}
