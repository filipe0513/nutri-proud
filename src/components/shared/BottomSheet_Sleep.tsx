/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/store';
import { useHistoryStore } from '@/store/historyStore';
import { toast } from 'sonner';
import { Moon, Minus, Plus, Trash2 } from 'lucide-react';
import { DatePickerInput } from './DatePickerInput';
import { ActivityLog } from '@/store/types';
import { toLocalISOString } from '@/lib/utils';
import { calculateSleepScore } from '@/utils/scoreUtils';

export function BottomSheet_Sleep({ 
  customTrigger,
  initialData,
  open,
  onOpenChange
}: { 
  customTrigger?: React.ReactNode;
  initialData?: ActivityLog;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const addLog = useAppStore(state => state.addLog);
  const updateLog = useAppStore(state => state.updateLog);
  const removeLog = useAppStore(state => state.removeLog);
  const updateLogHistory = useHistoryStore(state => state.updateLogHistory);
  const deleteLogHistory = useHistoryStore(state => state.deleteLogHistory);
  const userProfile = useAppStore(state => state.user_profile);
  const sleepTarget = userProfile?.targets?.sleep_hours_per_night || 8;
  
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const drawerOpen = isControlled ? open : internalOpen;

  const [duration, setDuration] = useState(8);
  const [awokeTimes, setAwokeTimes] = useState(0);
  const [quality, setQuality] = useState<'cansado' | 'normal' | 'revigorado' | null>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialData?.event_time) {
      return new Date(initialData.event_time).toISOString().slice(0, 16);
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  useEffect(() => {
    if (initialData) {
      setDuration(initialData.details.duration_hours || 8);
      setAwokeTimes(initialData.details.awoke_times || 0);
      setQuality(initialData.details.quality_feeling || null);
      setSelectedDate(new Date(initialData.event_time).toISOString().slice(0, 16));
    }
  }, [initialData]);

  const resetState = () => {
    if (!initialData) {
      setDuration(8);
      setAwokeTimes(0);
      setQuality('normal');
      const now = new Date();
      setSelectedDate(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
    if (!newOpen) {
      setTimeout(resetState, 300);
    }
  };

  const handleSave = async () => {
    if (!quality) {
      toast.error('Selecione a qualidade do sono!');
      return;
    }

    try {
      setIsSubmitting(true);

      const score = calculateSleepScore(duration, awokeTimes, quality, sleepTarget);

      const logData = {
        event_time: toLocalISOString(new Date(selectedDate)),
        category: 'sleep' as const,
        primary_value: score,
        details: { 
          duration_hours: duration,
          awoke_times: awokeTimes,
          quality_feeling: quality
        }
      };

      if (initialData) {
        await updateLog(initialData.id, logData);
        updateLogHistory(initialData.id, logData);
        toast.success('Sono atualizado!', {
          className: 'bg-indigo-500 text-white border-transparent'
        });
        if (isControlled && onOpenChange) onOpenChange(false);
      } else {
        await addLog(logData);
        toast.success('Sono registrado!', {
          className: 'bg-indigo-500 text-white border-transparent'
        });
        if (isControlled && onOpenChange) {
          onOpenChange(false);
        } else {
          setInternalOpen(false);
        }
      }
      
      setTimeout(resetState, 300);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await removeLog(initialData.id);
      deleteLogHistory(initialData.id);
      toast.success('Registro apagado!', {
        className: 'bg-indigo-500 text-white border-transparent'
      });
      if (isControlled && onOpenChange) onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao apagar registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DrawerTrigger asChild>
          {customTrigger ? customTrigger : (
            <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
              <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Moon className="h-8 w-8 text-indigo-500" />
                </div>
                <p className="text-body-1 font-bold text-neutral-500 text-center px-2">Sono</p>
              </CardContent>
            </Card>
          )}
        </DrawerTrigger>
      )}
      
      <DrawerContent className="!bg-indigo-50/95 backdrop-blur-2xl border-t border-indigo-200 text-indigo-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-2 text-indigo-950">
              {initialData ? 'Editar Sono' : 'Como foi sua noite?'}
            </DrawerTitle>
            <DatePickerInput
              value={selectedDate}
              onChange={setSelectedDate}
              accentColor="text-indigo-700"
              borderColor="border-indigo-200"
            />
          </div>
        </DrawerHeader>

        <div className="flex flex-col mt-4 space-y-8">
          
          {/* Duration */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-body-1 font-medium text-indigo-900/80">Duração</span>
              <span className="text-title-3 font-bold text-indigo-950">{duration}h</span>
            </div>
            <div className="w-full touch-none relative px-2">
              <Slider 
                value={[duration]} 
                min={0} 
                max={12} 
                step={0.5} 
                onValueChange={(val) => setDuration(val[0])}
                thumbClassName={(val) => {
                  if (val >= 7) return 'bg-notify-success border-notify-success';
                  if (val >= 5) return 'bg-notify-warning border-notify-warning';
                  return 'bg-notify-error border-notify-error';
                }}
              />
            </div>
          </div>

          {/* Awoke times */}
          <div className="flex justify-between items-center">
            <span className="text-body-1 font-medium text-indigo-900/80">Acordou quantas vezes?</span>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setAwokeTimes(Math.max(0, awokeTimes - 1))}
                className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 active:scale-95 transition-transform"
              >
                <Minus size={20} />
              </button>
              <span className="text-title-3 font-bold text-indigo-950 w-6 text-center">{awokeTimes}</span>
              <button 
                onClick={() => setAwokeTimes(awokeTimes + 1)}
                className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-3">
            <span className="text-body-1 font-medium text-indigo-900/80">Qualidade</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cansado', label: '😴 Cansado' },
                { id: 'normal', label: '😐 Normal' },
                { id: 'revigorado', label: '⚡ Revigorado' }
              ].map(q => (
                <button
                  key={q.id}
                  onClick={() => setQuality(q.id as any)}
                  className={`h-14 rounded-2xl text-caption-1 font-medium transition-colors border ${
                    quality === q.id 
                      ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm' 
                      : 'bg-white/50 text-indigo-900 border-indigo-200 hover:bg-white/80'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {initialData ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-2xl border border-indigo-200 bg-white/50 text-indigo-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 flex-shrink-0"
                onClick={handleDelete}
                title="Apagar registro"
                disabled={isSubmitting}
              >
                <Trash2 size={18} />
              </Button>
              <Button 
                className="h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white border-transparent flex-1 text-button-1 shadow-md"
                onClick={handleSave}
                disabled={!quality || isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          ) : (
            <Button 
              className="h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white border-transparent w-full text-button-1 shadow-md"
              onClick={handleSave}
              disabled={!quality || isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Sono'}
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
