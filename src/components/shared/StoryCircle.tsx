'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StoryCircleProps {
  label: string;
  icon: LucideIcon;
  value: number; // 0 to 100
  color: string; // hex color for the ring
  active?: boolean;
  onClick?: () => void;
}

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = 64;
const CENTER = SIZE / 2;

export function StoryCircle({ label, icon: Icon, value, color, active, onClick }: StoryCircleProps) {
  const offset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center space-y-2 cursor-pointer" onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.9 }}
        className={`relative w-16 h-16 flex items-center justify-center ${
          active ? 'ring-2 ring-brand-500 ring-offset-2 rounded-full' : ''
        }`}
      >
        {/* SVG Progress Ring */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0"
        >
          {/* Background ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--color-ring-bg)"
            strokeWidth="4"
          />
          {/* Progress ring */}
          {value > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          )}
        </svg>

        {/* Icon center */}
        <div className="relative z-10 flex items-center justify-center">
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </motion.div>
      <span className="text-caption-1 font-medium text-neutral-400 tracking-tight">
        {label}
      </span>
    </div>
  );
}
