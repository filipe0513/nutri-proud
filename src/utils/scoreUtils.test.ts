import { describe, it, expect } from 'vitest';
import {
  calculateWaterScore,
  calculateSleepScore,
  calculateFoodScore,
  calculateMealQualityScore,
  calculateTrainingScore,
  calculateGutScore,
} from '@/utils/scoreUtils';

describe('scoreUtils', () => {
  // ─── Water ────────────────────────────────────────────────────────────────

  describe('calculateWaterScore', () => {
    it('returns 100 when total equals target', () => {
      expect(calculateWaterScore(2000, 2000)).toBe(100);
    });

    it('returns 75 when 1500ml of 2000ml target is consumed', () => {
      expect(calculateWaterScore(1500, 2000)).toBe(75);
    });

    it('caps at 100 when exceeding target', () => {
      expect(calculateWaterScore(3000, 2000)).toBe(100);
    });

    it('returns 0 when nothing consumed', () => {
      expect(calculateWaterScore(0, 2000)).toBe(0);
    });

    it('uses 2000ml default target when none provided', () => {
      expect(calculateWaterScore(1000)).toBe(50);
    });

    it('returns 0 when target is 0 (guard against division by zero)', () => {
      expect(calculateWaterScore(500, 0)).toBe(0);
    });
  });

  // ─── Sleep ────────────────────────────────────────────────────────────────

  describe('calculateSleepScore', () => {
    it('returns 100 for perfect sleep (on target, no wakes, revigorado)', () => {
      expect(calculateSleepScore(8, 0, 'revigorado', 8)).toBe(100);
    });

    it('returns proportional score for 6h with 8h target', () => {
      // 6/8 * 100 = 75, no wakes, no quality adjustment
      expect(calculateSleepScore(6, 0, 'normal', 8)).toBe(75);
    });

    it('deducts 5 pts for 1 wake-up', () => {
      // 8/8 * 100 - 5 = 95
      expect(calculateSleepScore(8, 1, 'normal', 8)).toBe(95);
    });

    it('deducts 10 pts for 2 wake-ups', () => {
      expect(calculateSleepScore(8, 2, 'normal', 8)).toBe(90);
    });

    it('deducts 20 pts for 3+ wake-ups', () => {
      expect(calculateSleepScore(8, 3, 'normal', 8)).toBe(80);
    });

    it('deducts 10 pts for cansado quality', () => {
      expect(calculateSleepScore(8, 0, 'cansado', 8)).toBe(90);
    });

    it('adds 10 pts for revigorado quality (capped at 100)', () => {
      expect(calculateSleepScore(8, 0, 'revigorado', 8)).toBe(100);
    });

    it('clamps result to [0, 100]', () => {
      // Very short sleep with many wakes and bad quality
      expect(calculateSleepScore(1, 4, 'cansado', 8)).toBe(0);
    });
  });

  // ─── Food ─────────────────────────────────────────────────────────────────

  describe('calculateFoodScore', () => {
    it('returns correct proportional score for 2 of 4 planned meals', () => {
      const logs = [
        { category: 'food', primaryValue: 80 },
        { category: 'food', primaryValue: 90 },
        { category: 'water', primaryValue: 100 }, // ignored
      ];
      // (80 + 90) / (4 * 100) * 100 = 170/400 * 100 ≈ 43
      expect(calculateFoodScore(logs, 4)).toBe(43);
    });

    it('caps at 100 when meals exceed target', () => {
      const logs = [
        { category: 'food', primaryValue: 100 },
        { category: 'food', primaryValue: 100 },
      ];
      // 200 / 100 * 100 = 200 → capped at 100
      expect(calculateFoodScore(logs, 1)).toBe(100);
    });

    it('returns 0 when no food logs', () => {
      expect(calculateFoodScore([], 3)).toBe(0);
    });

    it('accepts an array of meal IDs as plannedMeals', () => {
      const logs = [
        { category: 'food', primaryValue: 100 },
        { category: 'food', primaryValue: 100 },
        { category: 'food', primaryValue: 100 },
      ];
      // 300 / (3 * 100) * 100 = 100
      expect(calculateFoodScore(logs, ['breakfast', 'lunch', 'dinner'])).toBe(100);
    });
  });

  // ─── Meal Quality ─────────────────────────────────────────────────────────

  describe('calculateMealQualityScore', () => {
    it('returns 100 when all sliders are at centre (0)', () => {
      expect(calculateMealQualityScore(0, 0, 0, 0)).toBe(100);
    });

    it('returns 0 when all sliders are at max deviation (50)', () => {
      expect(calculateMealQualityScore(50, 50, 50, 50)).toBe(0);
    });

    it('returns 50 for average slider deviation of 25', () => {
      // avgDev = 25, qualityMultiplier = 1 - 25/50 = 0.5 → 50
      expect(calculateMealQualityScore(25, 25, 25, 25)).toBe(50);
    });
  });

  // ─── Training ─────────────────────────────────────────────────────────────

  describe('calculateTrainingScore', () => {
    it('returns 100 for neutral session (0, 0)', () => {
      expect(calculateTrainingScore(0, 0)).toBe(100);
    });

    it('returns 100 when both positive (capped)', () => {
      expect(calculateTrainingScore(50, 50)).toBe(100);
    });

    it('returns 80 for -20 cardio deviation', () => {
      expect(calculateTrainingScore(-20, 0)).toBe(80);
    });

    it('clamps to 0 for extreme negative deviations', () => {
      expect(calculateTrainingScore(-50, -50)).toBe(0);
    });
  });

  // ─── Gut ──────────────────────────────────────────────────────────────────

  describe('calculateGutScore', () => {
    it('returns 100 for normal', () => {
      expect(calculateGutScore('normal')).toBe(100);
    });

    it('returns 80 for hard', () => {
      expect(calculateGutScore('hard')).toBe(80);
    });

    it('returns 80 for liquid', () => {
      expect(calculateGutScore('liquid')).toBe(80);
    });

    it('returns 80 for gas', () => {
      expect(calculateGutScore('gas')).toBe(80);
    });

    it('returns 80 for unknown aspects', () => {
      expect(calculateGutScore('unknown_aspect')).toBe(80);
    });
  });
});
