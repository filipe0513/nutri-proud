'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StoryCircleProps {
  label: string;
  icon: LucideIcon;
  value: number; // 0 to 100
  active?: boolean;
  onClick?: () => void;
}

export function StoryCircle({ label, icon: Icon, value, active, onClick }: StoryCircleProps) {
  const getBorderColor = (v: number) => {
    if (v === 0) return 'border-white/40';
    if (v < 50) return 'border-notify-error';
    if (v < 75) return 'border-notify-warning';
    return 'border-notify-success';
  };

  return (
    <div className="flex flex-col items-center space-y-2 cursor-pointer" onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative w-16 h-16 rounded-full border-[3px] p-1 flex items-center justify-center bg-glass-light-1 backdrop-blur-sm transition-colors shadow-sm",
          getBorderColor(value),
          active && "ring-2 ring-brand-500 ring-offset-2"
        )}
      >
        <div className="w-full h-full rounded-full bg-glass-light-2 backdrop-blur-md flex items-center justify-center text-neutral-500">
          <Icon className="h-7 w-7" />
        </div>
        
        {/* Simple Progress Indicator (could be more advanced with SVG) */}
        {value > 0 && (
           <div className="absolute inset-[-3px] rounded-full overflow-hidden">
             {/* We could add a more complex SVG ring here for better visual */}
           </div>
        )}
      </motion.div>
      <span className="text-caption-1 font-semibold text-neutral-500/80 uppercase tracking-tight">{label}</span>
    </div>
  );
}
