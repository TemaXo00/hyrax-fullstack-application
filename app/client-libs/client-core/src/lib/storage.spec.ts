import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  readStoredNumber,
  readStoredString,
  writeStoredNumber,
  writeStoredString,
} from './storage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('storage helpers', () => {
  it('reads and writes strings', () => {
    writeStoredString('key', 'value');

    expect(readStoredString('key', 'fallback')).toBe('value');
    expect(readStoredString('missing', 'fallback')).toBe('fallback');
  });

  it('reads and writes numbers', () => {
    writeStoredNumber('count', 42);

    expect(readStoredNumber('count', 0)).toBe(42);
    expect(readStoredNumber('missing', 7)).toBe(7);
    expect(readStoredNumber('key', 7)).toBe(7);
  });

  it('survives forbidden localStorage access', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(() => writeStoredString('key', 'value')).not.toThrow();
    expect(readStoredString('key', 'fallback')).toBe('fallback');
    expect(readStoredNumber('key', 5)).toBe(5);
  });
});
