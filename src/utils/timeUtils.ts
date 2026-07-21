const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

/**
 * Returns a human-readable relative time label in Portuguese.
 * Examples: "agora", "há 5min", "há 2h", "há 1d", "há 3 sem"
 */
export function getRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();

  if (diff < MINUTE) return 'agora';
  if (diff < HOUR) return `há ${Math.floor(diff / MINUTE)}min`;
  if (diff < DAY) return `há ${Math.floor(diff / HOUR)}h`;
  if (diff < WEEK) return `há ${Math.floor(diff / DAY)}d`;
  if (diff < MONTH) return `há ${Math.floor(diff / WEEK)} sem`;

  return `há ${Math.floor(diff / MONTH)} mês${Math.floor(diff / MONTH) > 1 ? 'es' : ''}`;
}
