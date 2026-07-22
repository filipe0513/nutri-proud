/**
 * scoreUtils.ts — Single Source of Truth for all pillar score calculations.
 *
 * All functions are pure and isomorphic (safe for server and client use).
 * Every function guarantees a return value in [0, 100].
 */

/** Clamps a number to the [0, 100] range. */
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ---------------------------------------------------------------------------
// 💧 WATER
// ---------------------------------------------------------------------------

/**
 * Calculates the water score for the day.
 *
 * @param totalMl - Sum of ALL water log volumes for the day (ml).
 * @param targetMl - Daily water target in ml (default 2000).
 * @returns Score in [0, 100].
 */
export function calculateWaterScore(totalMl: number, targetMl = 2000): number {
  if (targetMl <= 0) return 0;
  return clamp((totalMl / targetMl) * 100);
}

// ---------------------------------------------------------------------------
// 💤 SLEEP
// ---------------------------------------------------------------------------

/**
 * Calculates the sleep score based on duration, interruptions, and quality.
 *
 * @param hours      - Duration of sleep in hours.
 * @param wakes      - Number of times the user woke up during the night.
 * @param quality    - Subjective quality: 'cansado' | 'normal' | 'revigorado'.
 * @param targetHours - Sleep target in hours (default 8).
 * @returns Score in [0, 100].
 */
export function calculateSleepScore(
  hours: number,
  wakes: number,
  quality: 'cansado' | 'normal' | 'revigorado' | null = 'normal',
  targetHours = 8
): number {
  if (targetHours <= 0) return 0;

  let score = (hours / targetHours) * 100;

  // Interruption penalty
  if (wakes === 1) score -= 5;
  else if (wakes === 2) score -= 10;
  else if (wakes >= 3) score -= 20;

  // Quality bonus/penalty
  if (quality === 'cansado') score -= 10;
  else if (quality === 'revigorado') score += 10;

  return clamp(score);
}

// ---------------------------------------------------------------------------
// 🍎 FOOD
// ---------------------------------------------------------------------------

/**
 * Calculates the food score for the day.
 *
 * Each planned meal is worth (100 / totalPlanned) points at most.
 * The individual meal's `primaryValue` already encodes the macro quality (0–100).
 *
 * @param logs        - All activity logs for the period (will be filtered to `food`).
 * @param plannedMeals - Number of planned meals OR array of meal IDs. Default 3.
 * @returns Score in [0, 100].
 */
export function calculateFoodScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[],
  plannedMeals: number | string[] = 3
): number {
  const totalMeals =
    typeof plannedMeals === 'number'
      ? plannedMeals
      : plannedMeals.length;

  const count = Math.max(1, totalMeals);

  const foodLogs = logs.filter(
    (log) => log.category?.toLowerCase() === 'food'
  );
  const sumScores = foodLogs.reduce(
    (acc, log) => acc + (log.primaryValue ?? log.primary_value ?? 0),
    0
  );

  const maxPossible = count * 100;
  return clamp((sumScores / maxPossible) * 100);
}

/**
 * Calculates the proportional quality score for a single meal.
 * Used by MealEqualizerDrawer when saving a food log.
 *
 * @param protein - Protein slider value (-50 to +50)
 * @param carbs   - Carbs slider value (-50 to +50)
 * @param fats    - Fats slider value (-50 to +50)
 * @param fiber   - Fiber slider value (-50 to +50)
 * @returns Score in [0, 100].
 */
export function calculateMealQualityScore(
  protein: number,
  carbs: number,
  fats: number,
  fiber: number
): number {
  const avgDeviation =
    (Math.abs(protein) + Math.abs(carbs) + Math.abs(fats) + Math.abs(fiber)) / 4;
  const qualityMultiplier = Math.max(0, 1 - avgDeviation / 50);
  return clamp(100 * qualityMultiplier);
}

// ---------------------------------------------------------------------------
// 💪 WORKOUT (Training)
// ---------------------------------------------------------------------------

/**
 * Calculates the training score using a compensatory model.
 * Starting from 100, adds/subtracts the cardio and load deviations.
 *
 * @param cardio - Cardio deviation (-50 to +50).
 * @param carga  - Load deviation (-50 to +50).
 * @returns Score in [0, 100].
 */
export function calculateTrainingScore(cardio: number, carga: number): number {
  return clamp(100 + cardio + carga);
}

// ---------------------------------------------------------------------------
// 💩 GUT (Intestinal)
// ---------------------------------------------------------------------------

const GUT_SCORE_MAP: Record<string, number> = {
  normal: 100,
  hard: 80,
  liquid: 80,
  gas: 80,
};

/**
 * Calculates the gut health score based on the bowel movement aspect.
 *
 * @param aspect - One of: 'normal' | 'hard' | 'liquid' | 'gas'
 * @returns Score in [0, 100].
 */
export function calculateGutScore(aspect: string): number {
  return GUT_SCORE_MAP[aspect] ?? 80;
}

// ---------------------------------------------------------------------------
// 🎨 UI GRADIENTS
// ---------------------------------------------------------------------------

/**
 * Returns a CSS linear-gradient string based on the given score (0-100).
 *
 * Mapping:
 * <= 50: Purple (Critical)
 * <= 60: Red (Bad)
 * <= 70: Orange (Reasonable)
 * <= 80: Yellow/Amber (Good)
 * <= 90: Blue (Very Good)
 * > 90: Green (Excellent)
 */
export function getScoreGradient(score: number): string {
  if (score <= 50) {
    return 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)';
  }
  if (score <= 60) {
    return 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)';
  }
  if (score <= 70) {
    return 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)';
  }
  if (score <= 80) {
    return 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)';
  }
  if (score <= 90) {
    return 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)';
  }
  return 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)';
}
