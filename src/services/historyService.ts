export const historyService = {
  /**
   * Calculates food score based on targets and logs.
   * Defined as a pure utility function to be completely client-safe.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculateFoodScore(logs: any[], targets: any): number {
    const plannedMeals = targets?.planned_meals;
    const totalMeals = plannedMeals?.length || 3;
    const foodLogs = logs.filter(
      (log) => log.category?.toLowerCase() === 'food'
    );
    const somaReal = foodLogs.reduce(
      (acc, log) => acc + (log.primaryValue ?? log.primary_value ?? 0),
      0
    );
    const pontuacaoMaxima = totalMeals * 100;
    const percentage = Math.round((somaReal / pontuacaoMaxima) * 100);
    return Math.max(0, Math.min(100, percentage));
  },

  /**
   * Calculates the overall health score of a day (0 to 100%) based on the logs of that day
   * and the user targets.
   *
   * Each of the 5 pillars (water, food, workout, sleep, poop) is normalized to a maximum of 100%
   * before computing the final rounded average.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculateDayScore(dayLogs: any[], userProfile: any): number {
    const CATEGORIES = ['water', 'food', 'workout', 'sleep', 'poop'] as const;

    const categoryScores = CATEGORIES.map((catId) => {
      const catLogs = dayLogs.filter(
        (log) => log.category?.toLowerCase() === catId
      );

      if (catId === 'water') {
        const total = catLogs.reduce(
          (acc, log) => acc + (log.details?.quantity_ml || 0),
          0
        );
        const target = userProfile?.targets?.water_ml_per_day || 2000;
        const pct = target > 0 ? (total / target) * 100 : 0;
        return Math.min(100, pct);
      }

      if (catId === 'food') {
        return this.calculateFoodScore(dayLogs, userProfile?.targets);
      }

      if (catLogs.length === 0) return 0;

      const avg =
        catLogs.reduce(
          (acc, log) => acc + (log.primaryValue ?? log.primary_value ?? 0),
          0
        ) / catLogs.length;
      return Math.max(0, Math.min(100, Math.round(avg)));
    });

    const total = categoryScores.reduce((acc, s) => acc + s, 0);
    return Math.round(total / CATEGORIES.length);
  },
};
