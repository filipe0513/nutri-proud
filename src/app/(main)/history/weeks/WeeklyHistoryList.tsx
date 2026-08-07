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

/** Formata uma Date para string ISO YYYY-MM-DD no fuso local */
function toLocalISODate(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function WeeklyHistoryList({ history }: WeeklyHistoryListProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareWeekStart, setShareWeekStart] = useState<string>('');
  const [shareWeekEnd, setShareWeekEnd] = useState<string>('');

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
                aria-label="Compartilhar semana"
                onClick={() => {
                  // Passa o intervalo exato da semana para o drawer pré-selecionar o período correto
                  setShareWeekStart(toLocalISODate(new Date(week.startDate)));
                  setShareWeekEnd(toLocalISODate(new Date(week.endDate)));
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
        weekStart={shareWeekStart || undefined}
        weekEnd={shareWeekEnd || undefined}
      />
    </>
  );
}
