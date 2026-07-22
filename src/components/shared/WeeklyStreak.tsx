'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/store';

interface WeekDay {
  date: string; // ISO string (serialized from Date)
  dayLabel: string;
  score: number | null;
  isToday: boolean;
  isFuture: boolean;
}

import { getScoreColors } from '@/utils/scoreUtils';

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

function StreakDay({ day, activeAnimation }: { day: WeekDay, activeAnimation?: 'bump' | 'glory' | null }) {
  const hasScore = day.score !== null;
  const isActive = !day.isFuture && hasScore;
  const score = day.score ?? 0;

  const colors = isActive ? getScoreColors(score) : { from: 'transparent', to: 'transparent' };
  const isGlory = isActive && score === 100;

  // Squircle base classes
  const squircleBase =
    'relative w-10 h-10 flex items-center justify-center transition-all duration-300 overflow-hidden';

  const squircleRadius = 'rounded-[10px]'; // ~squircle

  // Background and borders based on state
  let squircleBg = '';
  if (isActive) {
    squircleBg = 'bg-neutral-50 border border-neutral-200/60'; // light background for the empty part
  } else if (day.isFuture) {
    squircleBg = 'bg-neutral-50/50 border border-dashed border-neutral-200';
  } else {
    // past day with no logs (cinza)
    squircleBg = 'bg-neutral-200 border border-neutral-300/50';
  }

  // Icon colors based on state
  const iconColor = isActive 
    ? 'white' 
    : day.isFuture 
      ? '#d1d5db' // neutral-300
      : '#9ca3af'; // neutral-400 (mais escuro para diferenciar)

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center gap-1.5 relative"
    >
      {/* SVG Definitions for the Flame Gradient (Glory State) */}
      {isGlory && (
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="glory-flame-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Squircle */}
      <motion.div
        animate={
          activeAnimation === 'glory'
            ? { scale: [1, 1.25, 1] }
            : activeAnimation === 'bump'
              ? { scale: [1, 1.15, 1] }
              : { scale: 1 }
        }
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className={`${squircleBase} ${squircleRadius} ${squircleBg} ${isGlory ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-neutral-50' : ''}`}
        style={{
          boxShadow: isGlory ? '0 0 12px 2px rgba(74, 222, 128, 0.4)' : isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          borderColor: isGlory ? 'rgba(74, 222, 128, 0.5)' : undefined,
        }}
      >
        {/* Fill layer without gradient artifacts */}
        {isActive && (
          <div 
             className="absolute bottom-0 left-0 right-0 w-full transition-all duration-700 ease-out"
             style={{
               height: `${score}%`,
               background: `linear-gradient(to top, ${colors.from}, ${colors.to})`
             }}
          />
        )}

        <AnimatePresence>
          {activeAnimation === 'glory' && (
            <motion.div
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 rounded-[10px] border-2 border-green-400 z-0"
            />
          )}
        </AnimatePresence>

        {/* Today ring pulse */}
        {day.isToday && (
          <motion.div
            className="absolute inset-0 rounded-[10px] z-10 pointer-events-none"
            animate={{ boxShadow: ['0 0 0 0px rgba(0,0,0,0.1)', '0 0 0 4px rgba(0,0,0,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {day.isToday && isActive ? (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame
                className={`w-4 h-4 ${isGlory ? 'drop-shadow-md' : 'drop-shadow-sm'}`}
                stroke={isGlory ? 'url(#glory-flame-grad)' : 'white'}
                fill={isGlory ? 'url(#glory-flame-grad)' : 'white'}
              />
            </motion.div>
          ) : (
            <Flame
              className="w-4 h-4"
              stroke={isGlory ? 'url(#glory-flame-grad)' : iconColor}
              fill={isGlory ? 'url(#glory-flame-grad)' : isActive ? 'white' : 'transparent'}
            />
          )}
        </div>
      </motion.div>

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
  const activityLogs = useAppStore((state) => state.activity_logs);
  
  const justLoggedAnimate = useAppStore((state) => state.justLoggedAnimate);
  const setJustLoggedAnimate = useAppStore((state) => state.setJustLoggedAnimate);

  const previousTodayScoreRef = useRef<number | null>(null);
  const pendingAnimationRef = useRef<'bump' | 'glory' | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<'bump' | 'glory' | null>(null);

  useEffect(() => {
    fetch('/api/progress/weekly')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WeekDay[] | null) => {
        if (data) {
          setDays(data);
          const today = data.find(d => d.isToday);
          if (today && today.score !== null) {
            if (previousTodayScoreRef.current !== null && today.score > previousTodayScoreRef.current) {
              pendingAnimationRef.current = today.score === 100 ? 'glory' : 'bump';
            }
            previousTodayScoreRef.current = today.score;
          }
        }
      })
      .catch(() => {/* silent — component simply stays hidden */})
      .finally(() => setLoading(false));
  }, [activityLogs]);

  useEffect(() => {
    if (justLoggedAnimate) {
      const pending = pendingAnimationRef.current;
      if (pending) {
        setTimeout(() => {
          setActiveAnimation(pending);
          pendingAnimationRef.current = null;
        }, 0);
        setTimeout(() => setActiveAnimation(null), 1000);
      }
      setJustLoggedAnimate(false);
    }
  }, [justLoggedAnimate, setJustLoggedAnimate]);

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
    <Link href="/profile/me" aria-label="Ver meu perfil" className="block group">
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
            <StreakDay key={i} day={day} activeAnimation={day.isToday ? activeAnimation : null} />
          ))}
        </motion.div>
      </div>
    </Link>
  );
}
