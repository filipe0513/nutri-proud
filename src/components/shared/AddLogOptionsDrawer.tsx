'use client';

import { Droplets, Utensils, Dumbbell, Moon, Smile } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface AddLogOptionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPillar: (pillar: 'water' | 'meal' | 'workout' | 'sleep' | 'poop') => void;
}

const PILLARS = [
  {
    id: 'water' as const,
    label: 'Água',
    emoji: '💧',
    icon: Droplets,
    color: 'var(--color-cat-water)',
    bg: 'bg-blue-50',
    border: 'border-blue-200/60',
    hoverBg: 'hover:bg-blue-100/80',
  },
  {
    id: 'meal' as const,
    label: 'Alimentação',
    emoji: '🍎',
    icon: Utensils,
    color: 'var(--color-cat-food)',
    bg: 'bg-green-50',
    border: 'border-green-200/60',
    hoverBg: 'hover:bg-green-100/80',
  },
  {
    id: 'sleep' as const,
    label: 'Sono',
    emoji: '💤',
    icon: Moon,
    color: 'var(--color-cat-sleep)',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200/60',
    hoverBg: 'hover:bg-indigo-100/80',
  },
  {
    id: 'workout' as const,
    label: 'Treino',
    emoji: '💪',
    icon: Dumbbell,
    color: 'var(--color-cat-workout)',
    bg: 'bg-red-50',
    border: 'border-red-200/60',
    hoverBg: 'hover:bg-red-100/80',
  },
  {
    id: 'poop' as const,
    label: 'Intestino',
    emoji: '💩',
    icon: Smile,
    color: 'var(--color-cat-poop)',
    bg: 'bg-amber-50',
    border: 'border-amber-200/60',
    hoverBg: 'hover:bg-amber-100/80',
  },
] as const;

export function AddLogOptionsDrawer({
  open,
  onOpenChange,
  onSelectPillar,
}: AddLogOptionsDrawerProps) {
  const handleSelect = (pillarId: 'water' | 'meal' | 'workout' | 'sleep' | 'poop') => {
    onOpenChange(false);
    // Small delay so the first drawer closes before the second opens
    setTimeout(() => onSelectPillar(pillarId), 180);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-10">
        <DrawerHeader className="px-0 pb-2">
          <DrawerTitle className="text-title-3 text-neutral-500">
            O que deseja registrar?
          </DrawerTitle>
        </DrawerHeader>

        {/* 2-column grid — ergonomic layout for thumb reach */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {PILLARS.slice(0, 4).map((pillar) => (
            <button
              key={pillar.id}
              type="button"
              id={`btn-add-log-${pillar.id}`}
              aria-label={`Registrar ${pillar.label}`}
              onClick={() => handleSelect(pillar.id)}
              className={`flex flex-col items-center justify-center gap-2 h-24 rounded-2xl ${pillar.bg} ${pillar.border} ${pillar.hoverBg} border transition-all duration-200 active:scale-95 group`}
            >
              <span className="text-3xl leading-none select-none">{pillar.emoji}</span>
              <span className="text-body-2 font-semibold text-neutral-500 group-active:text-neutral-600">
                {pillar.label}
              </span>
            </button>
          ))}

          {/* 5th item — full width */}
          {PILLARS[4] && (
            <button
              key={PILLARS[4].id}
              type="button"
              id={`btn-add-log-${PILLARS[4].id}`}
              aria-label={`Registrar ${PILLARS[4].label}`}
              onClick={() => handleSelect(PILLARS[4].id)}
              className={`col-span-2 flex flex-row items-center justify-center gap-3 h-16 rounded-2xl ${PILLARS[4].bg} ${PILLARS[4].border} ${PILLARS[4].hoverBg} border transition-all duration-200 active:scale-95 group`}
            >
              <span className="text-2xl leading-none select-none">{PILLARS[4].emoji}</span>
              <span className="text-body-1 font-semibold text-neutral-500 group-active:text-neutral-600">
                {PILLARS[4].label}
              </span>
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
