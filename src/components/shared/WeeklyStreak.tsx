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

// ─── Squircle visual states ───────────────────────────────────────────────────

function getSquircleClasses(day: WeekDay): string {
  const base =
    'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300';

  if (day.isFuture) {
    return `${base} bg-transparent border border-dashed border-neutral-200`;
  }
  if (day.score === null) {
    // Past day with no logs
    return `${base} bg-neutral-200`;
  }
  // Scored day — fire gradient
  const ring = day.isToday ? ' ring-2 ring-orange-400 ring-offset-2' : '';
  return `${base} bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-sm${ring}`;
}

function getFlameClasses(day: WeekDay): string {
  if (day.isFuture) return 'w-4 h-4 text-neutral-300';
  if (day.score === null) return 'w-4 h-4 text-white/50';
  return 'w-4 h-4 text-white fill-white drop-shadow-sm';
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
  const isActive = !day.isFuture && day.score !== null;

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center gap-1.5"
    >
      {/* Squircle */}
      <div className={getSquircleClasses(day)}>
        {isActive && day.isToday ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Flame className={getFlameClasses(day)} />
          </motion.div>
        ) : (
          <Flame className={getFlameClasses(day)} />
        )}
      </div>

      {/* Day label */}
      <span
        className={`text-caption-2 font-semibold ${
          day.isToday ? 'text-orange-500' : 'text-neutral-400'
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
            <div className="w-10 h-10 rounded-2xl bg-neutral-200" />
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
            Semana em chamas
          </p>
          {streak > 0 && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="inline-flex items-center gap-1 text-caption-1 font-bold text-orange-500"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              {streak} {streak === 1 ? 'dia' : 'dias'} seguidos
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
