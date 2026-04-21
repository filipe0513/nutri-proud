'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/store';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Droplets, 
  Utensils, 
  Moon, 
  Dumbbell, 
  Smile,
  ChevronLeft,
  Calendar as CalendarIcon,
  Check,
  ArrowUp,
  ArrowDown,
  StickyNote
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoryPage() {
  const { activity_logs } = useAppStore();

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: typeof activity_logs } = {};
    
    // Sort logs by date descending
    const sortedLogs = [...activity_logs].sort((a, b) => 
      new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
    );

    sortedLogs.forEach(log => {
      const dateKey = format(parseISO(log.event_time), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });

    return groups;
  }, [activity_logs]);

  const MEAL_LABELS: Record<string, string> = {
    breakfast: 'Café da manhã',
    morning_snack: 'Lanche da manhã',
    lunch: 'Almoço',
    dessert: 'Sobremesa',
    afternoon_snack: 'Lanche da tarde',
    dinner: 'Jantar'
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'water': return <Droplets className="h-5 w-5 text-blue-500" />;
      case 'food': return <Utensils className="h-5 w-5 text-orange-500" />;
      case 'sleep': return <Moon className="h-5 w-5 text-indigo-500" />;
      case 'workout': return <Dumbbell className="h-5 w-5 text-red-500" />;
      case 'poop': return <Smile className="h-5 w-5 text-green-500" />;
      case 'note': return <StickyNote className="h-5 w-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getLogTitle = (log: any) => {
    switch (log.category) {
      case 'water': return `${log.details.quantity_ml}ml de Água`;
      case 'food': return `Refeição: ${MEAL_LABELS[log.details.meal_type] || 'Alimento'}`;
      case 'sleep': return `Registro de Sono`;
      case 'workout': return `Treino`;
      case 'poop': return `Saúde Intestinal`;
      case 'note': return `Nota`;
      default: return 'Atividade';
    }
  };

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="min-h-screen pb-24 pt-8 px-6 max-w-lg mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Button asChild variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm hover:bg-glass-light-2 text-neutral-500">
          <Link href="/">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-title-1 text-neutral-500">Diário</h1>
      </div>

      {Object.keys(groupedLogs).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="h-20 w-20 bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-full flex items-center justify-center">
            <CalendarIcon className="h-10 w-10 text-neutral-500/80" />
          </div>
          <p className="text-body-1 font-medium text-neutral-500">Nenhum registro encontrado.<br/>Comece agora mesmo!</p>
          <Button asChild className="rounded-2xl bg-brand-500 text-button-1 text-white hover:bg-brand-400">
            <Link href="/">Voltar para Início</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([date, logs]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-caption-1 font-bold text-neutral-500/80 uppercase tracking-widest px-1">
                {formatDateHeader(date)}
              </h3>
              <div className="space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-2xl shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-xl bg-glass-light-2 backdrop-blur-sm border border-white/40 flex items-center justify-center shrink-0">
                            {getCategoryIcon(log.category)}
                          </div>
                          <div>
                            <p className="text-body-1 font-bold text-neutral-500">{getLogTitle(log)}</p>
                            {log.details.notes && (
                              <p className="text-caption-1 text-neutral-500/80 mt-1 line-clamp-2">{log.details.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-caption-1 font-bold text-neutral-500/80 self-start mt-1 shrink-0">
                          {format(parseISO(log.event_time), 'HH:mm')}
                        </div>
                      </div>

                      {log.details.factors && Object.keys(log.details.factors).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 ml-14">
                          {Object.entries(log.details.factors).map(([key, value]) => {
                            const val = value as number;
                            let Icon = Check;
                            let colorClass = "text-notify-success bg-notify-success-glass border border-notify-success/20";
                            
                            if (val > 0) {
                              Icon = ArrowUp;
                              colorClass = "text-notify-error bg-notify-error-glass border border-notify-error/20";
                            } else if (val < 0) {
                              Icon = ArrowDown;
                              colorClass = "text-brand-500 bg-brand-100/50 border border-brand-500/20";
                            }

                            const factorLabel: any = {
                              protein: 'Proteína',
                              carbs: 'Carbo',
                              fats: 'Gordura',
                              fiber: 'Fibra',
                              cardio: 'Cardio',
                              carga: 'Carga'
                            };

                            return (
                              <div key={key} className={`flex items-center space-x-1 px-2 py-1 rounded-md ${colorClass}`}>
                                <Icon className="h-3 w-3" />
                                <span className="text-caption-2 font-bold uppercase">{factorLabel[key] || key}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// Add missing imports
import { Home, History, Settings } from 'lucide-react';
