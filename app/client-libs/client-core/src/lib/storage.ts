export function readStoredString(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Приватный режим браузера может запрещать запись — это не критично.
  }
}

export function readStoredNumber(key: string, fallback: number): number {
  const stored = readStoredString(key, '');

  if (stored === '') {
    return fallback;
  }

  const value = Number(stored);

  return Number.isFinite(value) ? value : fallback;
}

export function writeStoredNumber(key: string, value: number): void {
  writeStoredString(key, String(value));
}
