'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getWorkoutStreakPhrase,
  getDailyStreakPhrase,
  getSlumpPhrase,
} from '@/utils/motivationPhrases';

interface StreakData {
  workout: { streak: number; type: 'weekly' };
  bestDaily: { category: string; streak: number; type: 'daily' };
}

interface DynamicStreakCardProps {
  userId: string;
}

export function DynamicStreakCard({ userId }: DynamicStreakCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [phrase, setPhrase] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [hasStreak, setHasStreak] = useState(false);

  useEffect(() => {
    if (!userId) return;

    fetch('/api/streaks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: StreakData | null) => {
        if (!data) return;

        const { workout, bestDaily } = data;

        // Pick the best streak to showcase
        if (workout.streak >= bestDaily.streak && workout.streak > 0) {
          setHasStreak(true);
          setStreakCount(workout.streak);
          setPhrase(getWorkoutStreakPhrase(workout.streak));
        } else if (bestDaily.streak > 0) {
          setHasStreak(true);
          setStreakCount(bestDaily.streak);
          setPhrase(getDailyStreakPhrase(bestDaily.streak, bestDaily.category));
        } else {
          setHasStreak(false);
          setPhrase(getSlumpPhrase());
        }
      })
      .catch(() => {
        setHasStreak(false);
        setPhrase(getSlumpPhrase());
      });
  }, [userId]);

  if (dismissed || phrase === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0, overflow: 'hidden' }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={`backdrop-blur-md text-white rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative ${
            hasStreak ? 'bg-glass-dark-2' : 'bg-neutral-500/80'
          }`}
        >
          <button
            aria-label="Fechar card de streak"
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Flame className="h-24 w-24" />
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <div
                className={`p-2 rounded-xl ${hasStreak ? 'bg-notify-warning' : 'bg-white/20'}`}
              >
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-title-3">
                {hasStreak ? `${streakCount} ${streakCount === 1 ? 'Dia' : 'Dias'} de Fogo` : 'Hora de recomeçar!'}
              </span>
            </div>
            <p className="text-body-2 text-white/80">{phrase}</p>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
