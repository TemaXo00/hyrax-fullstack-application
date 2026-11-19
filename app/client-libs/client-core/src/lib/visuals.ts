import type { CosmeticSlot } from '@org/types';

export interface RoomTheme {
  sky: string;
  floor: string;
  label: string;
  ink: string;
}

const DEFAULT_ROOM: RoomTheme = {
  sky: 'linear-gradient(180deg, #f4e8d4 0%, #ecd9bd 62%, #e5cfae 100%)',
  floor: '#d8bd94',
  label: 'Тёплая комната',
  ink: '#5b4d3c',
};

const ROOM_THEMES: Array<{ match: string; theme: RoomTheme }> = [
  {
    match: 'закат',
    theme: {
      sky: 'linear-gradient(180deg, #f7ddc0 0%, #efb29a 58%, #dc9685 100%)',
      floor: '#c98572',
      label: 'Закат',
      ink: '#6d4238',
    },
  },
  {
    match: 'космическ',
    theme: {
      sky: 'linear-gradient(180deg, #262c47 0%, #3f466b 58%, #66638d 100%)',
      floor: '#3a3f5f',
      label: 'Космос',
      ink: '#e8e5f5',
    },
  },
  {
    match: 'лес',
    theme: {
      sky: 'linear-gradient(180deg, #dfe8ce 0%, #c7d6b2 58%, #aec394 100%)',
      floor: '#94ab7d',
      label: 'Лес',
      ink: '#3f5234',
    },
  },
  {
    match: 'мор',
    theme: {
      sky: 'linear-gradient(180deg, #dceef0 0%, #b7dce0 58%, #8ec6cb 100%)',
      floor: '#7fb4b8',
      label: 'Море',
      ink: '#315e62',
    },
  },
];

export function getRoomTheme(backgroundName: string | null): RoomTheme {
  if (!backgroundName) {
    return DEFAULT_ROOM;
  }

  const normalized = backgroundName.toLowerCase();
  const matched = ROOM_THEMES.find((entry) => normalized.includes(entry.match));

  return matched?.theme ?? DEFAULT_ROOM;
}

const FOOD_GLYPHS: Record<string, string> = {
  морковка: '🥕',
  яблоко: '🍎',
  рыбка: '🐟',
  корм: '🥣',
  пирожное: '🧁',
  арбуз: '🍉',
};

export function getFoodGlyph(name: string): string {
  const normalized = name.toLowerCase();
  const matched = Object.entries(FOOD_GLYPHS).find(([key]) =>
    normalized.includes(key),
  );

  return matched?.[1] ?? '🥣';
}

const COSMETIC_GLYPHS: Record<string, string> = {
  кепка: '🧢',
  цилиндр: '🎩',
  очки: '🕶️',
  цепь: '📿',
  закат: '🌅',
  космическ: '🌌',
};

export function getCosmeticGlyph(name: string, slot?: CosmeticSlot): string {
  const normalized = name.toLowerCase();
  const matched = Object.entries(COSMETIC_GLYPHS).find(([key]) =>
    normalized.includes(key),
  );

  if (matched) {
    return matched[1];
  }

  if (slot === 'HAT') {
    return '🎩';
  }

  if (slot === 'BACKGROUND') {
    return '🖼️';
  }

  return '✨';
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));

  if (seconds < 60) {
    return `${seconds} с`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return rest > 0 ? `${minutes} м ${rest} с` : `${minutes} м`;
}

export function pluralize(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  }

  return many;
}
