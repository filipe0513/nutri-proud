'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/store';
import { StoryCircle } from './StoryCircle';
import { Droplets, Utensils, Dumbbell, Moon, Smile } from 'lucide-react';
import Link from 'next/link';

interface StoryHeaderProps {
  onCategorySelect?: (categoryId: string) => void;
}

export function StoryHeader({ onCategorySelect }: StoryHeaderProps) {
  const { user_profile, activity_logs } = useAppStore();

  const todayLogs = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return activity_logs.filter(log => new Date(log.event_time) >= startOfDay);
  }, [activity_logs]);

  const categories = [
    { id: 'water', label: 'Água', icon: Droplets, target: user_profile?.targets?.water_ml_per_day || 2000, unit: 'ml' },
    { id: 'food', label: 'Comida', icon: Utensils, target: user_profile?.targets?.meals_per_day || 4, unit: 'ref' },
    { id: 'workout', label: 'Treino', icon: Dumbbell, target: user_profile?.targets?.weekly_workouts || 3, unit: 'sessão' },
    { id: 'sleep', label: 'Sono', icon: Moon, target: user_profile?.targets?.sleep_hours_per_night || 8, unit: 'h' },
    { id: 'poop', label: 'Intestino', icon: Smile, target: 1, unit: 'vez' },
  ];

  const getProgress = (catId: string) => {
    const catLogs = todayLogs.filter(log => log.category === catId);
    
    if (catId === 'water') {
      const total = catLogs.reduce((acc, log) => acc + (log.details?.quantity_ml || 0), 0);
      return Math.min(100, (total / (user_profile?.targets?.water_ml_per_day || 2000)) * 100);
    }
    
    if (catId === 'food') {
      return Math.min(100, (catLogs.length / (user_profile?.targets?.meals_per_day || 4)) * 100);
    }
    
    if (catId === 'workout') {
      return catLogs.length > 0 ? 100 : 0;
    }
    
    if (catId === 'sleep') {
      // Simplificado: se houver log de sono, considera 100% para o MVP
      return catLogs.length > 0 ? 100 : 0;
    }

    if (catId === 'poop') {
      return catLogs.length > 0 ? 100 : 0;
    }
    
    return 0;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-1 text-neutral-500/80">Olá,</p>
          <h1 className="text-title-1 text-neutral-500">{user_profile?.name || 'Explorador'}</h1>
        </div>
      </div>

      <div className="flex justify-between overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar space-x-4">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/pillar/${cat.id}`}>
            <StoryCircle
              label={cat.label}
              icon={cat.icon}
              value={getProgress(cat.id)}
              onClick={() => onCategorySelect?.(cat.id)}
            />
          </Link>
        ))}
      </div>
    </>
  );
}
