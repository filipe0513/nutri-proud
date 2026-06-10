/**
 * Central date utility module.
 *
 * This module is the SINGLE SOURCE OF TRUTH for all day-boundary calculations
 * in this application. All services and components that need "start of day" or
 * "end of day" boundaries MUST import from here — never use `new Date().setHours(0,0,0,0)`
 * or `setUTCHours(0,0,0,0)` scattered through the codebase.
 *
 * Strategy:
 *  - Server-side: Node.js runs in UTC. We compensate using 'America/Sao_Paulo'
 *    timezone explicitly via `Intl.DateTimeFormat`, keeping the same approach
 *    already used in `streakService.ts` and `reportService.ts`.
 *  - Client-side: Browser `Date` methods (`getFullYear`, `getMonth`, etc.) already
 *    use the device's local timezone, so they are correct as-is.
 */

const SERVER_TIMEZONE = 'America/Sao_Paulo';

/**
 * Extracts the local date parts for a given Date object using the São Paulo timezone.
 * This is the correct approach for server-side code running in UTC.
 */
function getLocalParts(date: Date, timeZone: string = SERVER_TIMEZONE): {
  year: number;
  month: number;
  day: number;
} {
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Returns the UTC Date equivalent of 00:00:00.000 for the given date
 * in the São Paulo timezone (UTC-3 / UTC-2 during DST).
 *
 * Example: If `date` represents "2026-06-10 23:50 BRT (-03:00)", this returns
 * the UTC Date for "2026-06-10 00:00:00.000 BRT" = "2026-06-10 03:00:00.000 UTC".
 *
 * @param date - Reference date. Defaults to now.
 */
export function getLocalStartOfDay(date: Date = new Date()): Date {
  const { year, month, day } = getLocalParts(date);
  // Build the ISO string for midnight in São Paulo, then parse to UTC Date
  const localMidnight = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000`;
  // We need to find the UTC offset for São Paulo at this specific moment
  const offsetMs = getOffsetMs(date);
  return new Date(new Date(localMidnight + 'Z').getTime() + offsetMs);
}

/**
 * Returns the UTC Date equivalent of 23:59:59.999 for the given date
 * in the São Paulo timezone.
 *
 * @param date - Reference date. Defaults to now.
 */
export function getLocalEndOfDay(date: Date = new Date()): Date {
  const { year, month, day } = getLocalParts(date);
  const localEnd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999`;
  const offsetMs = getOffsetMs(date);
  return new Date(new Date(localEnd + 'Z').getTime() + offsetMs);
}

/**
 * Returns the UTC offset in milliseconds for São Paulo at the given moment.
 * São Paulo follows -03:00 (BRT) and -02:00 (BRST) during daylight saving time.
 *
 * We derive it by comparing what UTC midnight looks like vs what São Paulo midnight
 * looks like, using the Intl API as the source of truth.
 */
function getOffsetMs(date: Date): number {
  // Parse the ISO date in São Paulo timezone using the Intl API
  const { year, month, day } = getLocalParts(date);

  // UTC timestamp for midnight UTC of this local date
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  // Actual UTC time of midnight in São Paulo:
  // We try each candidate (UTC-2 or UTC-3) and verify using Intl
  for (const offsetHours of [3, 2]) {
    const candidate = utcMidnight + offsetHours * 3600 * 1000;
    const check = getLocalParts(new Date(candidate));
    if (check.year === year && check.month === month && check.day === day) {
      return offsetHours * 3600 * 1000;
    }
  }

  // Fallback: assume BRT = UTC-3
  return 3 * 3600 * 1000;
}

/**
 * Returns a YYYY-MM-DD date key string for a given UTC Date, resolved
 * in the São Paulo timezone. Used for grouping logs by local day.
 *
 * @param date - A Date object (typically parsed from an ISO string).
 */
export function getLocalDateKey(date: Date): string {
  const { year, month, day } = getLocalParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Formats a Date for display using the pt-BR locale and the São Paulo timezone.
 *
 * @param date - The date to format.
 * @param options - Optional `Intl.DateTimeFormatOptions`. Defaults to date + time.
 */
export function formatDateToLocal(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SERVER_TIMEZONE,
    ...options,
  }).format(date);
}
