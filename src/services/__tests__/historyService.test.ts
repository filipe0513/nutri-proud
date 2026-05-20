/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { historyService } from '../historyService';

describe('historyService.calculateDayScore', () => {
  it('should return 0 when there are no logs', () => {
    // Arrange
    const logs: any[] = [];
    const profile = {
      targets: {
        water_ml_per_day: 2000,
        planned_meals: ['breakfast', 'lunch', 'dinner'],
      },
    };

    // Act
    const score = historyService.calculateDayScore(logs, profile);

    // Assert
    expect(score).toBe(0);
  });

  it('should correctly normalize and calculate score when all pillars are perfect (100%)', () => {
    // Arrange
    const logs = [
      { category: 'water', details: { quantity_ml: 2000 } }, // 100%
      { category: 'food', primaryValue: 100 }, // 100% (1 meal logged of 3 planned, wait, no, let's make food logs match targets)
      { category: 'food', primaryValue: 100 },
      { category: 'food', primaryValue: 100 }, // Total = 300 / 300 = 100%
      { category: 'workout', primaryValue: 100 }, // 100%
      { category: 'sleep', primaryValue: 100 }, // 100%
      { category: 'poop', primaryValue: 100 }, // 100%
    ];
    const profile = {
      targets: {
        water_ml_per_day: 2000,
        planned_meals: ['breakfast', 'lunch', 'dinner'], // 3 meals
      },
    };

    // Act
    const score = historyService.calculateDayScore(logs, profile);

    // Assert
    expect(score).toBe(100);
  });

  it('should guarantee that individual pillars and final score are capped at 100% even if targets are exceeded', () => {
    // Arrange
    const logs = [
      { category: 'water', details: { quantity_ml: 4000 } }, // 200% -> should be capped at 100%
      { category: 'food', primaryValue: 100 },
      { category: 'food', primaryValue: 100 },
      { category: 'food', primaryValue: 100 },
      { category: 'food', primaryValue: 100 }, // 400 / 300 = 133% -> should be capped at 100%
      { category: 'workout', primaryValue: 120 }, // 120% -> should be capped at 100%
      { category: 'sleep', primaryValue: 150 }, // 150% -> should be capped at 100%
      { category: 'poop', primaryValue: 100 }, // 100%
    ];
    const profile = {
      targets: {
        water_ml_per_day: 2000,
        planned_meals: ['breakfast', 'lunch', 'dinner'],
      },
    };

    // Act
    const score = historyService.calculateDayScore(logs, profile);

    // Assert
    expect(score).toBe(100);
  });

  it('should correctly average different percentage scores across the 5 pillars', () => {
    // Arrange
    // Pillars scores:
    // Water: 1000ml / 2000ml = 50%
    // Food: 2 meals of 100 pts each = 200 / 300 = 66.67% -> rounds to 67%
    // Workout: 80% (1 log of 80)
    // Sleep: no logs = 0%
    // Poop: 100% (1 log of 100)
    // Average = (50 + 67 + 80 + 0 + 100) / 5 = 297 / 5 = 59.4 -> rounds to 59
    const logs = [
      { category: 'water', details: { quantity_ml: 1000 } },
      { category: 'food', primary_value: 100 },
      { category: 'food', primary_value: 100 },
      { category: 'workout', primaryValue: 80 },
      { category: 'poop', primaryValue: 100 },
    ];
    const profile = {
      targets: {
        water_ml_per_day: 2000,
        planned_meals: ['breakfast', 'lunch', 'dinner'],
      },
    };

    // Act
    const score = historyService.calculateDayScore(logs, profile);

    // Assert
    expect(score).toBe(59);
  });

  it('should support mixed casing for categories', () => {
    // Arrange
    const logs = [
      { category: 'WATER', details: { quantity_ml: 1000 } }, // 50%
      { category: 'Food', primaryValue: 90 }, // 1 meal logged = 90 / 300 = 30%
      { category: 'WORKOUT', primaryValue: 80 }, // 80%
      { category: 'Sleep', primaryValue: 70 }, // 70%
      { category: 'Poop', primaryValue: 100 }, // 100%
      // Sum = 50 + 30 + 80 + 70 + 100 = 330
      // Average = 330 / 5 = 66%
    ];
    const profile = {
      targets: {
        water_ml_per_day: 2000,
        planned_meals: ['breakfast', 'lunch', 'dinner'],
      },
    };

    // Act
    const score = historyService.calculateDayScore(logs, profile);

    // Assert
    expect(score).toBe(66);
  });
});
