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
    if (v === 0) return 'border-slate-200';
    if (v < 50) return 'border-red-500';
    if (v < 75) return 'border-yellow-500';
    return 'border-green-500';
  };

  return (
    <div className="flex flex-col items-center space-y-2 cursor-pointer" onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative w-16 h-16 rounded-full border-[3px] p-1 flex items-center justify-center bg-white transition-colors shadow-sm",
          getBorderColor(value),
          active && "ring-2 ring-slate-900 ring-offset-2"
        )}
      >
        <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-slate-700">
          <Icon className="h-7 w-7" />
        </div>
        
        {/* Simple Progress Indicator (could be more advanced with SVG) */}
        {value > 0 && (
           <div className="absolute inset-[-3px] rounded-full overflow-hidden">
             {/* We could add a more complex SVG ring here for better visual */}
           </div>
        )}
      </motion.div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{label}</span>
    </div>
  );
}
