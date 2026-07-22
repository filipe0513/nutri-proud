'use client';

import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { getScoreColors } from '@/utils/scoreUtils';

interface ProfileCalendarProps {
  /** Record of date strings (YYYY-MM-DD) mapped to their daily score (0-100) */
  scoresByDate: Record<string, number>;
}

export function ProfileCalendar({ scoresByDate }: ProfileCalendarProps) {
  // Generate days for the current month
  const { daysInMonth, startDayOfWeek, currentMonthName, year } = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth(); // 0-11
    
    // First day of the month
    const firstDay = new Date(y, m, 1);
    // Last day of the month
    const lastDay = new Date(y, m + 1, 0);
    
    // Day of the week for the 1st (0 = Sunday, 1 = Monday, etc.)
    const startDay = firstDay.getDay(); 
    
    return {
      daysInMonth: lastDay.getDate(),
      startDayOfWeek: startDay,
      currentMonthName: firstDay.toLocaleString('pt-BR', { month: 'long' }),
      year: y,
      month: m,
    };
  }, []);

  const today = new Date();
  const currentDay = today.getDate();

  return (
    <div className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-[2rem] p-5 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-title-3 font-semibold text-neutral-500 capitalize">
          {currentMonthName} {year}
        </h3>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-3 gap-x-1">
        {/* Days of week header */}
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-caption-2 font-bold text-neutral-400">
            {day}
          </div>
        ))}
        
        {/* Empty cells before start of month */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dateNum = i + 1;
          const isFuture = dateNum > currentDay;
          
          // Format date to YYYY-MM-DD local
          const m = (today.getMonth() + 1).toString().padStart(2, '0');
          const d = dateNum.toString().padStart(2, '0');
          const dateStr = `${year}-${m}-${d}`;
          
          const rawScore = scoresByDate[dateStr];
          const hasScore = rawScore !== undefined && rawScore !== null;
          const score = hasScore ? rawScore : 0;

          const colors = hasScore ? getScoreColors(score) : { from: 'transparent', to: 'transparent' };
          const isGlory = hasScore && score === 100;
          
          return (
            <div key={dateStr} className="flex justify-center items-center relative">
              {/* SVG Definitions for the Flame Gradient (Glory State) */}
              {isGlory && (
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id={`cal-glory-${dateStr}`} x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                </svg>
              )}

              <div 
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all relative ${
                  isGlory ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-neutral-50' : ''
                } ${!hasScore ? (isFuture ? 'bg-neutral-200/50 border border-dashed border-neutral-300' : 'bg-neutral-200') : 'bg-neutral-200/40 border'}`}
                style={{
                  background: hasScore ? `linear-gradient(to top, ${colors.from} 0%, ${colors.to} ${score}%, transparent ${score}%)` : undefined,
                  boxShadow: isGlory ? '0 0 12px 2px rgba(74, 222, 128, 0.4)' : hasScore ? '0 2px 8px rgba(0,0,0,0.12)' : undefined,
                  borderColor: isGlory ? 'rgba(74, 222, 128, 0.5)' : hasScore ? 'rgba(0,0,0,0.05)' : undefined,
                }}
              >
                {hasScore ? (
                  <Flame 
                    className={`w-4 h-4 ${isGlory ? 'drop-shadow-md' : 'drop-shadow-sm'}`} 
                    stroke={isGlory ? `url(#cal-glory-${dateStr})` : 'white'}
                    fill={isGlory ? `url(#cal-glory-${dateStr})` : 'white'}
                  />
                ) : (
                  <Flame 
                    className="w-4 h-4" 
                    style={{ 
                      color: isFuture ? '#e5e7eb' : '#d1d5db', 
                      fill: 'transparent' 
                    }} 
                  />
                )}
                {/* Optional: Add a small dot or style if it is today */}
                {dateNum === currentDay && (
                  <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-neutral-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
