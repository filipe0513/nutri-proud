'use client';

import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { getScoreGradient } from '@/utils/scoreUtils';

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
          
          const score = scoresByDate[dateStr];
          const hasScore = score !== undefined && score !== null;
          
          return (
            <div key={dateStr} className="flex justify-center items-center">
              <div 
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all relative"
                style={{
                  background: hasScore ? getScoreGradient(score) : undefined,
                  boxShadow: hasScore ? '0 2px 8px rgba(0,0,0,0.15)' : undefined,
                }}
              >
                {hasScore ? (
                  <Flame className="w-4 h-4 text-white fill-white drop-shadow-sm" />
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
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-neutral-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
