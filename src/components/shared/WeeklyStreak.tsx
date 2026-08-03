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

interface WeekHistoryItem {
  id: string;
  startDate: string;
  endDate: string;
  averageScore: number;
  degree: string;
  isCurrentWeek: boolean;
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

  const renderFlame = (isFilled: boolean, isGloryFlame: boolean = false) => {
    const stroke = isGloryFlame ? 'url(#glory-flame-grad)' : isFilled ? 'white' : (day.isFuture ? '#d1d5db' : '#9ca3af');
    const fill = isGloryFlame ? 'url(#glory-flame-grad)' : isFilled ? 'white' : 'transparent';
    const dropShadow = isGloryFlame ? 'drop-shadow-md' : isFilled ? 'drop-shadow-sm' : '';
    
    const flameNode = (
      <Flame
        className={`w-4 h-4 ${dropShadow}`}
        stroke={stroke}
        fill={fill}
      />
    );

    if (day.isToday && isActive) {
      return (
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {flameNode}
        </motion.div>
      );
    }

    return flameNode;
  };

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center gap-1.5 relative"
    >
      {/* SVG Definitions for the Flame Gradient (Glory State) */}
      {isGlory && (
        <svg width="0" height="0" className="absolute">
          <defs>
            <radialGradient id="glory-flame-grad" cx="50%" cy="50%" r="50%" fx="50%" fy="80%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ef4444" />
            </radialGradient>
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
        {/* Base Icon */}
        {!isGlory && (
           <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
              {renderFlame(false, false)}
           </div>
        )}

        {/* Fill layer with clipped white/glory flame */}
        {isActive && (
          <div 
             className="absolute bottom-0 left-0 right-0 w-full transition-all duration-700 ease-out overflow-hidden z-10"
             style={{
               height: `${score}%`,
               background: `linear-gradient(to top, ${colors.from}, ${colors.to})`
             }}
          >
             <div className="absolute bottom-0 left-0 w-full h-10 flex items-center justify-center">
                 {renderFlame(true, isGlory)}
             </div>
          </div>
        )}

        <AnimatePresence>
          {activeAnimation === 'glory' && (
            <motion.div
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 rounded-[10px] border-2 border-green-400 z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Today ring pulse */}
        {day.isToday && (
          <motion.div
            className="absolute inset-0 rounded-[10px] z-30 pointer-events-none"
            animate={{ boxShadow: ['0 0 0 0px rgba(0,0,0,0.1)', '0 0 0 4px rgba(0,0,0,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
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

function computeWeeklyStreakText(history: WeekHistoryItem[]): string {
  const completedWeeks = history.filter((w) => !w.isCurrentWeek);
  
  if (completedWeeks.length === 0) {
    return "Semana inicial, foco total";
  }

  const degreeValue: Record<string, number> = {
    'Excelente': 5,
    'Muito Boa': 4,
    'Boa': 3,
    'Regular': 2,
    'Ruim': 1,
  };

  let maxGrauValue = 0;
  let maxGrauLabel = '';
  
  for (const w of completedWeeks) {
    const val = degreeValue[w.degree] || 0;
    if (val > maxGrauValue) {
      maxGrauValue = val;
      maxGrauLabel = w.degree;
    }
  }

  let streak = 0;
  for (const w of completedWeeks) {
    if ((degreeValue[w.degree] || 0) >= maxGrauValue) {
      streak++;
    } else {
      break;
    }
  }

  const getDegreePlural = (label: string) => {
    if (label === 'Excelente') return 'Excelentes';
    if (label === 'Muito Boa') return 'Muito Boas';
    if (label === 'Boa') return 'Boas';
    if (label === 'Regular') return 'Regulares';
    return 'Ruins';
  };

  if (streak > 0) {
    if (streak === 1) {
      return `1 semana ${maxGrauLabel.toLowerCase()}`;
    }
    return `${streak} semanas ${getDegreePlural(maxGrauLabel).toLowerCase()} seguidas`;
  } else {
    let x = 0;
    for (const w of completedWeeks) {
      if ((degreeValue[w.degree] || 0) >= maxGrauValue) x++;
    }
    return `${x}/${completedWeeks.length} semanas ${getDegreePlural(maxGrauLabel).toLowerCase()}`;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeeklyStreak() {
  const [days, setDays] = useState<WeekDay[]>([]);
  const [history, setHistory] = useState<WeekHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const activityLogs = useAppStore((state) => state.activity_logs);
  
  const justLoggedAnimate = useAppStore((state) => state.justLoggedAnimate);
  const setJustLoggedAnimate = useAppStore((state) => state.setJustLoggedAnimate);

  const previousTodayScoreRef = useRef<number | null>(null);
  const pendingDaysUpdateRef = useRef<WeekDay[] | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<'bump' | 'glory' | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch('/api/progress/weekly').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/progress/history-weeks').then((res) => (res.ok ? res.json() : null))
    ])
      .then(([data, historyData]: [WeekDay[] | null, WeekHistoryItem[] | null]) => {
        if (!isMounted) return;
        if (data) {
          const isOverlayOpen = useAppStore.getState().successOverlay?.isOpen;
          if (isOverlayOpen) {
            pendingDaysUpdateRef.current = data;
          } else {
            setDays(data);
            if (historyData) setHistory(historyData);
            const today = data.find((d) => d.isToday);
            if (today && today.score !== null) {
              previousTodayScoreRef.current = today.score;
            }
            setLoading(false);
          }
        }
      })
      .catch(() => {/* silent */})
      .finally(() => {
        if (isMounted && !useAppStore.getState().successOverlay?.isOpen) {
          setLoading(false);
        }
      });
      
    return () => {
      isMounted = false;
    };
  }, [activityLogs]);

  useEffect(() => {
    if (justLoggedAnimate) {
      const data = pendingDaysUpdateRef.current;
      if (data) {
        setDays(data);
        fetch('/api/progress/history-weeks')
          .then((res) => (res.ok ? res.json() : null))
          .then((hist) => { if (hist) setHistory(hist); });
          
        const today = data.find((d) => d.isToday);
        if (today && today.score !== null) {
          if (previousTodayScoreRef.current !== null && today.score > previousTodayScoreRef.current) {
            const animType = today.score === 100 ? 'glory' : 'bump';
            setTimeout(() => {
              setActiveAnimation(animType);
              setTimeout(() => setActiveAnimation(null), 1000);
            }, 400); // 400ms delay after score visual increment
          }
          previousTodayScoreRef.current = today.score;
        }
        pendingDaysUpdateRef.current = null;
        setLoading(false);
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

  const streakText = computeWeeklyStreakText(history);

  return (
    <Link href="/history/weeks" aria-label="Ver histórico de semanas" className="block group">
      <div className="space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between px-1">
          <p className="text-body-2 font-semibold text-neutral-400">
            Como está sua semana atual
          </p>
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="inline-flex items-center gap-1 text-caption-1 font-bold text-orange-500"
          >
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            {streakText}
          </motion.span>
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
