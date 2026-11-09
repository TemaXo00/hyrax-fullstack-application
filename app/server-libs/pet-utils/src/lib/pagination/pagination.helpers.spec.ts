import { SHARED_CONFIG } from '@org/validation-config';

import { buildPaginationMeta, normalizePagination } from './pagination.helpers';

describe('pagination helpers', () => {
  describe('normalizePagination', () => {
    it('uses default page and limit when they are not provided', () => {
      expect(normalizePagination({})).toEqual({
        page: SHARED_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: SHARED_CONFIG.PAGINATION.DEFAULT_LIMIT,
        skip: 0,
      });
    });

    it('calculates skip from page and limit', () => {
      expect(normalizePagination({ page: 3, limit: 20 })).toEqual({
        page: 3,
        limit: 20,
        skip: 40,
      });
    });

    it('trims the search string and omits an empty one', () => {
      expect(
        normalizePagination({ page: 2, limit: 10, search: '  корм ' }),
      ).toEqual({
        page: 2,
        limit: 10,
        search: 'корм',
        skip: 10,
      });

      expect(normalizePagination({ search: '   ' })).not.toHaveProperty(
        'search',
      );
    });
  });

  describe('buildPaginationMeta', () => {
    it('builds navigation flags for a middle page', () => {
      expect(
        buildPaginationMeta(
          { page: 2, limit: 10, search: 'корм', skip: 10 },
          42,
        ),
      ).toEqual({
        page: 2,
        limit: 10,
        total: 42,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
        search: 'корм',
      });
    });

    it('keeps at least one page for an empty result', () => {
      expect(buildPaginationMeta({ page: 1, limit: 10, skip: 0 }, 0)).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });
  });
});
