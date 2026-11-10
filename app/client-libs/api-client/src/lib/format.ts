const numberFormatter = new Intl.NumberFormat('ru-RU');

export function formatNumber(value: number | string): string {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? numberFormatter.format(parsed) : '0';
}

export function formatCoins(value: number | string): string {
  return `${formatNumber(value)} монет`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeUntil(value: string | Date | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  const diff = date.getTime() - Date.now();

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  if (diff <= 0) {
    return 'уже сейчас';
  }

  const totalMinutes = Math.ceil(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);

    return `${days} д ${hours % 24} ч`;
  }

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }

  return `${minutes} мин`;
}

export function moodEmoji(mood: number): string {
  if (mood >= 70) {
    return '😸';
  }

  if (mood >= 30) {
    return '😺';
  }

  return '😿';
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
