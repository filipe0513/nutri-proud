import { describe, it, expect, vi, afterEach } from 'vitest';
import { shouldShowEvolutionReminder } from '../scoreUtils';

afterEach(() => {
  vi.useRealTimers();
});

const NOW = new Date('2026-08-11T12:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

describe('shouldShowEvolutionReminder', () => {
  it('retorna false quando não há challenge ativo', () => {
    expect(shouldShowEvolutionReminder(null, null)).toBe(false);
    expect(shouldShowEvolutionReminder(undefined, null)).toBe(false);
  });

  it('retorna false quando challenge existe mas weeklyEvolution=false', () => {
    expect(shouldShowEvolutionReminder({ weeklyEvolution: false }, null)).toBe(false);
  });

  it('retorna true quando challenge ativo com weeklyEvolution=true e sem log de evolução', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    expect(shouldShowEvolutionReminder({ weeklyEvolution: true }, null)).toBe(true);
    expect(shouldShowEvolutionReminder({ weeklyEvolution: true }, undefined)).toBe(true);
  });

  it('retorna false quando último log de evolução foi há ≤7 dias', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    expect(shouldShowEvolutionReminder({ weeklyEvolution: true }, { eventTime: daysAgo(7) })).toBe(false);
    expect(shouldShowEvolutionReminder({ weeklyEvolution: true }, { eventTime: daysAgo(3) })).toBe(false);
    expect(shouldShowEvolutionReminder({ weeklyEvolution: true }, { eventTime: daysAgo(0) })).toBe(false);
  });

  it('retorna true quando último log de evolução foi há >7 dias', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    expect(shouldShowEvolutionReminder({ weeklyEvolution: true }, { eventTime: daysAgo(8) })).toBe(true);
    expect(shouldShowEvolutionReminder({ weeklyEvolution: true }, { eventTime: daysAgo(30) })).toBe(true);
  });
});
