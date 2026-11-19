import { describe, expect, it } from 'vitest';

import {
  formatDuration,
  getCosmeticGlyph,
  getFoodGlyph,
  getRoomTheme,
  pluralize,
} from './visuals';

describe('getRoomTheme', () => {
  it('returns the default theme without a background', () => {
    expect(getRoomTheme(null).label).toBe('Тёплая комната');
    expect(getRoomTheme('Неизвестный фон').label).toBe('Тёплая комната');
  });

  it('matches known background names case-insensitively', () => {
    expect(getRoomTheme('Закатный фон').label).toBe('Закат');
    expect(getRoomTheme('КОСМИЧЕСКИЙ фон').label).toBe('Космос');
    expect(getRoomTheme('лесная поляна').label).toBe('Лес');
    expect(getRoomTheme('морской бриз').label).toBe('Море');
  });
});

describe('glyph helpers', () => {
  it('maps food names', () => {
    expect(getFoodGlyph('Морковка')).toBe('🥕');
    expect(getFoodGlyph('Неизвестно')).toBe('🥣');
  });

  it('maps cosmetic names and falls back to slot', () => {
    expect(getCosmeticGlyph('Кепка')).toBe('🧢');
    expect(getCosmeticGlyph('Что-то', 'HAT')).toBe('🎩');
    expect(getCosmeticGlyph('Что-то', 'BACKGROUND')).toBe('🖼️');
    expect(getCosmeticGlyph('Что-то', 'ACCESSORY')).toBe('✨');
  });
});

describe('formatDuration', () => {
  it('formats seconds and minutes', () => {
    expect(formatDuration(5)).toBe('5 с');
    expect(formatDuration(65)).toBe('1 м 5 с');
    expect(formatDuration(120)).toBe('2 м');
    expect(formatDuration(-1)).toBe('0 с');
  });
});

describe('pluralize', () => {
  it('chooses Russian plural forms', () => {
    expect(pluralize(1, 'день', 'дня', 'дней')).toBe('день');
    expect(pluralize(3, 'день', 'дня', 'дней')).toBe('дня');
    expect(pluralize(11, 'день', 'дня', 'дней')).toBe('дней');
    expect(pluralize(22, 'день', 'дня', 'дней')).toBe('дня');
  });
});
