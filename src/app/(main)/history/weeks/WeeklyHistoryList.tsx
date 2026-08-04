'use client';

import { useState } from 'react';
import { getScoreGradient } from '@/utils/scoreUtils';
import { Share2 } from 'lucide-react';
import { ShareReportDrawer } from '@/components/shared/ShareReportDrawer';

interface WeeklyHistoryItem {
  id: string;
  startDate: Date;
  endDate: Date;
  averageScore: number;
  degree: string;
  isCurrentWeek: boolean;
}

interface WeeklyHistoryListProps {
  history: WeeklyHistoryItem[];
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  }).format(d).replace('.', '');
}

export function WeeklyHistoryList({ history }: WeeklyHistoryListProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDate, setShareDate] = useState<string>('');

  if (history.length === 0) {
    return <p className="text-body-2 text-neutral-400 text-center mt-10">Nenhum histórico encontrado.</p>;
  }

  return (
    <>
      {history.map((week) => {
        const startDateStr = formatDate(week.startDate);
        const endDateStr = formatDate(week.endDate);
        const gradient = getScoreGradient(week.averageScore);
        
        return (
          <div 
            key={week.id} 
            className="bg-glass-light-1 backdrop-blur-sm border border-white/40 p-5 rounded-3xl shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-caption-1 text-neutral-400 font-medium">
                {startDateStr} - {endDateStr} {week.isCurrentWeek && '(Atual)'}
              </p>
              <p 
                className="text-title-2 font-bold mt-1" 
                style={{ 
                  background: gradient, 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {week.degree}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Compartilhar"
                onClick={() => {
                  const end = new Date(week.endDate);
                  // Pass the end date of the week as the "date" prop for the report
                  // The report drawer will likely just use this date for a daily score 
                  // or we can adjust it if type="STREAK". The task says "Share por semana",
                  // meaning maybe we just pass type="STREAK" or "DAILY_SCORE"?
                  // Actually the instruction just says "type='STREAK'" in the Drawer refactor options.
                  setShareDate(end.toISOString().split('T')[0]);
                  setShareOpen(true);
                }}
                className="p-2 rounded-full hover:bg-neutral-200/50 text-neutral-400 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>

              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-15" style={{ background: gradient }} />
                <span className="relative z-10 text-title-3 font-bold text-neutral-500">
                  {week.averageScore}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <ShareReportDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        type="STREAK"
        date={shareDate || undefined}
      />
    </>
  );
}
