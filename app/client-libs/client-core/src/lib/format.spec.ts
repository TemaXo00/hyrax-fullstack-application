import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clampPercent,
  formatCoins,
  formatDateTime,
  formatNumber,
  formatTimeUntil,
  moodEmoji,
} from './format';

describe('formatNumber', () => {
  it('formats numbers with ru-RU separators', () => {
    expect(formatNumber(1234).replace(/\s/g, ' ')).toBe('1 234');
    expect(formatNumber('5420')).toBe(
      new Intl.NumberFormat('ru-RU').format(5420),
    );
  });

  it('returns zero for invalid values', () => {
    expect(formatNumber('abc')).toBe('0');
    expect(formatNumber(Number.NaN)).toBe('0');
  });
});

describe('formatCoins', () => {
  it('adds the coins suffix', () => {
    expect(formatCoins(42)).toBe('42 монет');
  });
});

describe('formatDateTime', () => {
  it('formats valid dates and handles empty values', () => {
    const value = new Date('2026-01-02T03:04:00Z');
    const formatted = formatDateTime(value);

    expect(formatted).toContain('2026');
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime('not-a-date')).toBe('—');
  });
});

describe('formatTimeUntil', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts minutes, hours and days', () => {
    const now = new Date('2026-01-01T00:00:00Z');

    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(formatTimeUntil(new Date(now.getTime() + 5 * 60_000))).toBe('5 мин');
    expect(
      formatTimeUntil(new Date(now.getTime() + 2 * 3600_000 + 30 * 60_000)),
    ).toBe('2 ч 30 мин');
    expect(formatTimeUntil(new Date(now.getTime() + 26 * 3600_000))).toBe(
      '1 д 2 ч',
    );
  });

  it('handles past and invalid values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    expect(formatTimeUntil(new Date(Date.now() - 1000))).toBe('уже сейчас');
    expect(formatTimeUntil(undefined)).toBe('—');
    expect(formatTimeUntil('bad')).toBe('—');
  });
});

describe('moodEmoji', () => {
  it('maps mood thresholds', () => {
    expect(moodEmoji(90)).toBe('😸');
    expect(moodEmoji(50)).toBe('😺');
    expect(moodEmoji(10)).toBe('😿');
  });
});

describe('clampPercent', () => {
  it('clamps values to 0..100', () => {
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(42)).toBe(42);
    expect(clampPercent(150)).toBe(100);
  });
});
