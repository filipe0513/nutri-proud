'use client';

import { useMemo } from 'react';

interface VerticalEqualizerProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

export function VerticalEqualizer({ label, value, min, max, onChange }: VerticalEqualizerProps) {
  // Determine color based on value
  const colorClass = useMemo(() => {
    const mid = (min + max) / 2;
    if (value === mid) return 'bg-emerald-500';
    if (value > mid) return 'bg-red-500';
    return 'bg-purple-500';
  }, [value, min, max]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col items-center h-48 w-16 shrink-0">
      {/* Slider Area */}
      <div className="relative h-32 w-8 mt-2">
        {/* Rotated Native Input (Invisible but functional) */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-8 -rotate-90 opacity-0 cursor-pointer z-10"
        />
        
        {/* Visual Track */}
        <div className="absolute inset-0 bg-slate-100 rounded-full overflow-hidden flex flex-col justify-end shadow-inner">
          <div 
            className={`w-full transition-colors duration-300 ease-out ${colorClass}`}
            style={{ height: `${percentage}%`, transitionProperty: 'height, background-color' }}
          />
        </div>

        {/* Center Line Indicator (if it crosses 0) */}
        {min < 0 && max > 0 && (
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-300/50 -translate-y-1/2 pointer-events-none" />
        )}
      </div>

      {/* Labels */}
      <div className="mt-4 flex flex-col items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value > 0 ? `+${value}` : value}</span>
      </div>
    </div>
  );
}
