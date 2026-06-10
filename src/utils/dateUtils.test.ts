import { describe, it, expect } from 'vitest';
import { getLocalStartOfDay, getLocalEndOfDay, getLocalDateKey, formatDateToLocal } from './dateUtils';

/**
 * All tests in this file set TZ=America/Sao_Paulo (UTC-3) via the vitest config.
 * We simulate "late night" and "early morning" UTC timestamps to verify that
 * day boundaries are computed correctly relative to São Paulo time, not UTC.
 */

// São Paulo is UTC-3 (BRT). So midnight BRT = 03:00 UTC.
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

describe('getLocalStartOfDay', () => {
  it('returns 00:00:00.000 BRT for a date in the middle of the day', () => {
    // 2026-06-10 15:00 BRT = 2026-06-10 18:00 UTC
    const input = new Date('2026-06-10T18:00:00.000Z');
    const result = getLocalStartOfDay(input);
    // Expected: 2026-06-10 00:00 BRT = 2026-06-10 03:00:00.000 UTC
    expect(result.toISOString()).toBe('2026-06-10T03:00:00.000Z');
  });

  it('returns SAME day start for a time just before midnight BRT (23:50 BRT)', () => {
    // 23:50 BRT = 02:50 UTC next day — this is the classic bug scenario
    // A dinner logged at 23:50 BRT was appearing as next day in UTC
    const input = new Date('2026-06-11T02:50:00.000Z'); // 23:50 BRT on June 10
    const result = getLocalStartOfDay(input);
    // Expected: June 10 start in BRT = 2026-06-10 03:00 UTC
    expect(result.toISOString()).toBe('2026-06-10T03:00:00.000Z');
  });

  it('returns NEXT day start for a time just after midnight BRT (00:05 BRT)', () => {
    // 00:05 BRT = 03:05 UTC same calendar day
    const input = new Date('2026-06-10T03:05:00.000Z'); // 00:05 BRT on June 10
    const result = getLocalStartOfDay(input);
    // Expected: June 10 start in BRT = 2026-06-10 03:00 UTC
    expect(result.toISOString()).toBe('2026-06-10T03:00:00.000Z');
  });

  it('defaults to "now" when no argument is provided', () => {
    // Just verify it returns a valid Date and the time component is 00:00:00
    const result = getLocalStartOfDay();
    expect(result).toBeInstanceOf(Date);
    // The result's UTC hours should be 02 or 03 (BRT offset), never 00
    const hours = result.getUTCHours();
    expect(hours === 2 || hours === 3).toBe(true);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });
});

describe('getLocalEndOfDay', () => {
  it('returns 23:59:59.999 BRT for a date in the middle of the day', () => {
    // 2026-06-10 15:00 BRT = 2026-06-10 18:00 UTC
    const input = new Date('2026-06-10T18:00:00.000Z');
    const result = getLocalEndOfDay(input);
    // Expected: 2026-06-10 23:59:59.999 BRT = 2026-06-11 02:59:59.999 UTC
    expect(result.toISOString()).toBe('2026-06-11T02:59:59.999Z');
  });

  it('returns end of SAME BRT day for a late-night UTC timestamp that crossed midnight UTC', () => {
    // 23:50 BRT on June 10 = 02:50 UTC on June 11
    const input = new Date('2026-06-11T02:50:00.000Z');
    const result = getLocalEndOfDay(input);
    // End of June 10 BRT = 2026-06-11T02:59:59.999Z
    expect(result.toISOString()).toBe('2026-06-11T02:59:59.999Z');
  });
});

describe('getLocalDateKey', () => {
  it('returns YYYY-MM-DD for a mid-day BRT timestamp', () => {
    const input = new Date('2026-06-10T18:00:00.000Z'); // 15:00 BRT
    expect(getLocalDateKey(input)).toBe('2026-06-10');
  });

  it('returns the BRT date, not the UTC date, for late-night timestamps', () => {
    // The classic bug: 23:50 BRT → 02:50 UTC next day
    // Should be grouped as June 10, NOT June 11
    const input = new Date('2026-06-11T02:50:00.000Z'); // 23:50 BRT on June 10
    expect(getLocalDateKey(input)).toBe('2026-06-10');
  });

  it('returns the correct BRT date for just after midnight UTC (which is still prior evening in BRT)', () => {
    // 00:30 UTC = 21:30 BRT on the PREVIOUS calendar day
    const input = new Date('2026-06-11T00:30:00.000Z'); // 21:30 BRT on June 10
    expect(getLocalDateKey(input)).toBe('2026-06-10');
  });
});

describe('formatDateToLocal', () => {
  it('formats a UTC date in pt-BR format with São Paulo timezone', () => {
    // 2026-06-10 18:00 UTC = 2026-06-10 15:00 BRT
    const input = new Date('2026-06-10T18:00:00.000Z');
    const result = formatDateToLocal(input, { day: '2-digit', month: '2-digit', year: 'numeric' });
    expect(result).toBe('10/06/2026');
  });

  it('formats late-night UTC as the correct BRT date', () => {
    // 2026-06-11T02:50:00Z = 23:50 BRT on June 10 → should show 10/06/2026
    const input = new Date('2026-06-11T02:50:00.000Z');
    const result = formatDateToLocal(input, { day: '2-digit', month: '2-digit', year: 'numeric' });
    expect(result).toBe('10/06/2026');
  });

  it('includes time in default format options', () => {
    // 2026-06-10 18:00 UTC = 2026-06-10 15:00 BRT
    const input = new Date('2026-06-10T18:00:00.000Z');
    const result = formatDateToLocal(input);
    // Should include the local time (15:00)
    expect(result).toContain('15:00');
  });

  it('handles day-boundary correctly: shows 23:50 not 00:50 for late night BRT', () => {
    // 2026-06-11T02:50:00Z = 23:50 BRT
    const input = new Date('2026-06-11T02:50:00.000Z');
    const result = formatDateToLocal(input, { hour: '2-digit', minute: '2-digit' });
    expect(result).toBe('23:50');
  });

  it('shows the correct BRT offset time for a morning BRT timestamp', () => {
    // 2026-06-10T03:05:00Z = 00:05 BRT on June 10
    const input = new Date('2026-06-10T03:05:00.000Z');
    const result = formatDateToLocal(input, { hour: '2-digit', minute: '2-digit' });
    expect(result).toBe('00:05');
  });
});

describe('Day boundary: start + end together cover exactly the full local day', () => {
  it('a log at 23:50 BRT is within [startOfDay, endOfDay] for that BRT date', () => {
    const logTime = new Date('2026-06-11T02:50:00.000Z'); // 23:50 BRT June 10
    const start = getLocalStartOfDay(logTime);
    const end = getLocalEndOfDay(logTime);

    expect(logTime.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(logTime.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it('a log at 00:05 BRT is within [startOfDay, endOfDay] for that BRT date', () => {
    const logTime = new Date('2026-06-10T03:05:00.000Z'); // 00:05 BRT June 10
    const start = getLocalStartOfDay(logTime);
    const end = getLocalEndOfDay(logTime);

    expect(logTime.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(logTime.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it('interval covers exactly 24h - 1ms', () => {
    const refDate = new Date('2026-06-10T18:00:00.000Z');
    const start = getLocalStartOfDay(refDate);
    const end = getLocalEndOfDay(refDate);
    const durationMs = end.getTime() - start.getTime();
    // 24 hours = 86400000ms. Full day = 86400000 - 1ms = 86399999ms
    expect(durationMs).toBe(86400000 - 1);
  });
});

// Sanity check that offset detection is not affected by BRT_OFFSET_MS being used in a calculation
describe('BRT_OFFSET_MS constant sanity', () => {
  it('BRT_OFFSET_MS is 3 hours in milliseconds', () => {
    expect(BRT_OFFSET_MS).toBe(10800000);
  });
});
