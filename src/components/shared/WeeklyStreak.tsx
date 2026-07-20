'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeekDay {
  date: string; // ISO string (serialized from Date)
  dayLabel: string;
  score: number | null;
  isToday: boolean;
  isFuture: boolean;
}

// ─── Score → gradient mapping ─────────────────────────────────────────────────
// roxo <50 | vermelho <60 | amarelo <70 | azul <80 | verde >=80

function getScoreGradient(score: number): string {
  if (score < 50) {
    // Roxo — esforço mínimo
    return 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)';
  }
  if (score < 60) {
    // Vermelho — abaixo do esperado
    return 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)';
  }
  if (score < 70) {
    // Amarelo/âmbar — razoável
    return 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)';
  }
  if (score < 80) {
    // Azul — bom progresso
    return 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)';
  }
  // Verde — excelente
  return 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)';
}

// ─── Stagger animation variants ───────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 18 },
  },
};

// ─── Sub-component: single squircle day ──────────────────────────────────────

function StreakDay({ day }: { day: WeekDay }) {
  const hasScore = day.score !== null;
  const isActive = !day.isFuture && hasScore;

  // Squircle inline style — gradient when active, neutral-200 when not
  const squircleStyle: React.CSSProperties = isActive
    ? {
        background: getScoreGradient(day.score!),
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }
    : {};

  // Squircle base classes
  const squircleBase =
    'relative w-10 h-10 flex items-center justify-center transition-all duration-300';

  // Squircle shape via border-radius (squircle approximation)
  const squircleRadius = 'rounded-[10px]'; // ~squircle

  const squircleBg = isActive
    ? '' // handled by inline style
    : day.isFuture
      ? 'bg-neutral-200/50 border border-dashed border-neutral-300'
      : 'bg-neutral-200'; // past day with no logs

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center gap-1.5"
    >
      {/* Squircle */}
      <div
        className={`${squircleBase} ${squircleRadius} ${squircleBg}`}
        style={squircleStyle}
      >
        {/* Today ring pulse */}
        {day.isToday && (
          <motion.div
            className="absolute inset-0 rounded-[10px]"
            animate={{ boxShadow: ['0 0 0 0px rgba(255,255,255,0.5)', '0 0 0 3px rgba(255,255,255,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        {/* Icon */}
        {day.isToday && isActive ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Flame
              className="w-4 h-4 drop-shadow-sm"
              style={{ color: 'white', fill: 'white' }}
            />
          </motion.div>
        ) : (
          <Flame
            className="w-4 h-4"
            style={{
              color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
              fill: isActive ? 'white' : 'transparent',
              // For future/empty days, use a muted neutral color
              ...((!isActive) && { color: '#d1d5db', fill: 'transparent' }),
            }}
          />
        )}
      </div>

      {/* Day label */}
      <span
        className={`text-caption-2 font-semibold ${
          day.isToday ? 'text-neutral-500' : 'text-neutral-400'
        }`}
      >
        {day.dayLabel}
      </span>
    </motion.div>
  );
}

// ─── Streak counter helper ────────────────────────────────────────────────────

function computeStreak(days: WeekDay[]): number {
  // Count consecutive scored (score !== null) days from the most recent non-future day backwards
  // Today with score=0 still counts as "active" (user is in the game)
  const past = [...days].reverse().filter((d) => !d.isFuture);
  let streak = 0;
  for (const d of past) {
    if (d.score !== null) streak++;
    else break;
  }
  return streak;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeeklyStreak() {
  const [days, setDays] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/progress/weekly')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WeekDay[] | null) => {
        if (data) setDays(data);
      })
      .catch(() => {/* silent — component simply stays hidden */})
      .finally(() => setLoading(false));
  }, []);

  if (loading || days.length === 0) {
    // Skeleton placeholder — same height as the real component
    return (
      <div className="flex justify-between px-1 py-1 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-[10px] bg-neutral-200" />
            <div className="w-3 h-2.5 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    );
  }

  const streak = computeStreak(days);

  return (
    <Link href="/history" aria-label="Ver histórico semanal" className="block group">
      <div className="space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between px-1">
          <p className="text-body-2 font-semibold text-neutral-400">
            Como está sua semana atual
          </p>
          {streak > 0 && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="inline-flex items-center gap-1 text-caption-1 font-bold text-orange-500"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              {streak} {streak === 1 ? 'dia apenas' : 'dias seguidos'}
            </motion.span>
          )}
        </div>

        {/* Squircles row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex justify-between"
        >
          {days.map((day, i) => (
            <StreakDay key={i} day={day} />
          ))}
        </motion.div>
      </div>
    </Link>
  );
}
