'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/store';
import { motion } from 'framer-motion';

function getScoreMessage(score: number): string {
  if (score === 0) return 'Bora começar o dia!';
  if (score < 40) return 'Bora começar!';
  if (score < 60) return 'Vamos melhorar';
  if (score < 80) return 'Mandando bem!';
  return 'Dia incrível! 🏆';
}

function getScoreEmoji(score: number): string {
  if (score === 0) return '🌰';
  if (score < 40) return '🌱';
  if (score < 60) return '🌿';
  if (score < 80) return '🌳';
  return '🌟';
}

/** All 5 pillars that make up the score */
const CATEGORIES = ['water', 'food', 'workout', 'sleep', 'poop'] as const;

export function ScoreCard() {
  const { activity_logs, user_profile } = useAppStore();

  const todayScore = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayLogs = activity_logs.filter(
      (log) => new Date(log.event_time) >= startOfDay
    );

    // Calculate progress for each of the 5 categories (0-100 each)
    const categoryScores = CATEGORIES.map((catId) => {
      const catLogs = todayLogs.filter((log) => log.category === catId);

      if (catId === 'water') {
        const total = catLogs.reduce((acc, log) => acc + (log.details?.quantity_ml || 0), 0);
        const target = user_profile?.targets?.water_ml_per_day || 2000;
        return Math.min(100, (total / target) * 100);
      }

      if (catId === 'food') {
        const target = user_profile?.targets?.meals_per_day || 4;
        return Math.min(100, (catLogs.length / target) * 100);
      }

      if (catId === 'workout') {
        return catLogs.length > 0 ? 100 : 0;
      }

      if (catId === 'sleep') {
        return catLogs.length > 0 ? 100 : 0;
      }

      if (catId === 'poop') {
        return catLogs.length > 0 ? 100 : 0;
      }

      return 0;
    });

    // Average across all 5 categories
    const total = categoryScores.reduce((acc, s) => acc + s, 0);
    return Math.round(total / CATEGORIES.length);
  }, [activity_logs, user_profile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-gradient-score rounded-3xl p-6 relative overflow-hidden min-h-[160px] flex flex-col justify-between shadow-lg"
    >
      {/* Decorative emoji */}
      <div className="absolute top-4 right-6 text-5xl opacity-80 select-none pointer-events-none">
        {getScoreEmoji(todayScore)}
      </div>

      <p className="text-body-2 text-white/90 font-medium">Score do dia</p>

      <div>
        <div className="flex items-baseline space-x-1">
          <span className="text-[3.5rem] font-extrabold text-white leading-none tracking-tight">
            {todayScore}
          </span>
          <span className="text-body-1 text-white/70 font-normal">/100</span>
        </div>
        <p className="text-body-1 text-white/80 mt-1">
          {getScoreMessage(todayScore)}
        </p>
      </div>
    </motion.div>
  );
}
