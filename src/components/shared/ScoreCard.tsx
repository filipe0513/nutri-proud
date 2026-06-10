'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/store';
import { motion } from 'framer-motion';
import { historyService } from '@/services/historyService';

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



export function ScoreCard() {
  const { activity_logs, user_profile } = useAppStore();

  const todayScore = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayLogs = activity_logs.filter(
      (log) => new Date(log.event_time) >= startOfDay
    );
    return historyService.calculateDayScore(todayLogs, user_profile);
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
