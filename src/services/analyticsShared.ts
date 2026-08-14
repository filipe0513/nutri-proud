import { getLocalDateKey } from '@/utils/dateUtils';
import type { DateRange } from '@/schemas/analyticsSchema';

/**
 * Resolves a DateRange, defaulting to the last 30 days when input is absent or partial.
 *
 * @param input - Optional partial date range override.
 * @returns A complete DateRange with ISO 8601 datetime strings.
 */
export function resolveDateRange(input?: Partial<DateRange>): DateRange {
  const now = new Date();

  const to = input?.to ?? now.toISOString();

  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  const from = input?.from ?? defaultFrom.toISOString();

  return { from, to };
}

/**
 * Groups an array of Date objects by ISO week (YYYY-Www) and returns
 * a map of week label → count of dates falling in that week.
 *
 * Week label format: "YYYY-Www" (ISO 8601 week).
 *
 * @param dates - Array of Date objects to group.
 * @returns Map<weekLabel, count>
 */
export function groupByWeek(dates: Date[]): Map<string, number> {
  const result = new Map<string, number>();

  for (const date of dates) {
    const label = getISOWeekLabel(date);
    result.set(label, (result.get(label) ?? 0) + 1);
  }

  return result;
}

/**
 * Returns an ISO 8601 week label ("YYYY-Www") for a given date.
 * Uses getLocalDateKey indirectly for date formatting consistency,
 * but computes the week number via standard ISO rules.
 */
function getISOWeekLabel(date: Date): string {
  // ISO week: week 1 contains the first Thursday of the year.
  // Use UTC getters so the grouping key is timezone-agnostic regardless of
  // where the Node.js process is running.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Set to nearest Thursday (ISO: Thursday = day 4)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

// Re-export for convenience so callers can use getLocalDateKey without a separate import.
export { getLocalDateKey };
