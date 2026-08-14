import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveDateRange, groupByWeek } from '../analyticsShared';

// ── resolveDateRange ──────────────────────────────────────

describe('resolveDateRange', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-08-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to a 30-day window when no input is provided', () => {
    // Arrange / Act
    const range = resolveDateRange();

    // Assert
    const from = new Date(range.from);
    const to = new Date(range.to);
    const diffDays = Math.round(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(30);
  });

  it('uses "to" = now when only "from" is provided', () => {
    // Arrange
    const customFrom = '2026-07-01T00:00:00.000Z';

    // Act
    const range = resolveDateRange({ from: customFrom });

    // Assert
    expect(range.from).toBe(customFrom);
    expect(new Date(range.to).getTime()).toBeCloseTo(
      new Date('2026-08-14T12:00:00.000Z').getTime(),
      -3
    );
  });

  it('respects both "from" and "to" when provided', () => {
    // Arrange
    const input = {
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-30T23:59:59.000Z',
    };

    // Act
    const range = resolveDateRange(input);

    // Assert
    expect(range.from).toBe(input.from);
    expect(range.to).toBe(input.to);
  });

  it('uses default "from" when only "to" is provided', () => {
    // Arrange
    const customTo = '2026-08-14T12:00:00.000Z';

    // Act
    const range = resolveDateRange({ to: customTo });

    // Assert
    expect(range.to).toBe(customTo);
    const diffDays = Math.round(
      (new Date(range.to).getTime() - new Date(range.from).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(30);
  });
});

// ── groupByWeek ───────────────────────────────────────────

describe('groupByWeek', () => {
  it('returns an empty map for an empty array', () => {
    const result = groupByWeek([]);
    expect(result.size).toBe(0);
  });

  it('groups dates in the same ISO week under a single key', () => {
    // 2026-08-10 (Mon) and 2026-08-14 (Fri) are both in ISO week 33 of 2026
    const dates = [
      new Date('2026-08-10T00:00:00.000Z'),
      new Date('2026-08-14T00:00:00.000Z'),
    ];

    const result = groupByWeek(dates);

    expect(result.size).toBe(1);
    expect(result.get('2026-W33')).toBe(2);
  });

  it('splits dates across different ISO weeks', () => {
    // 2026-08-09 (Sun) is in week 32; 2026-08-10 (Mon) is in week 33
    const dates = [
      new Date('2026-08-09T00:00:00.000Z'), // W32
      new Date('2026-08-10T00:00:00.000Z'), // W33
      new Date('2026-08-14T00:00:00.000Z'), // W33
    ];

    const result = groupByWeek(dates);

    expect(result.size).toBe(2);
    expect(result.get('2026-W32')).toBe(1);
    expect(result.get('2026-W33')).toBe(2);
  });

  it('handles dates spanning a year boundary correctly (W53/W01)', () => {
    // 2026-01-01 is a Thursday → ISO W01 of 2026
    const dates = [new Date('2026-01-01T00:00:00.000Z')];
    const result = groupByWeek(dates);
    expect(result.has('2026-W01')).toBe(true);
  });
});
