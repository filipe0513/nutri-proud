/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/store';
import { useHistoryStore } from '@/store/historyStore';
import { toast } from 'sonner';
import { Smile, Trash2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { DatePickerInput } from './DatePickerInput';
import { ActivityLog } from '@/store/types';
import { toLocalISOString } from '@/lib/utils';
import { calculateGutScore } from '@/utils/scoreUtils';
import { PoopAnalysisDrawer } from '@/components/shared/PoopAnalysisDrawer';

export function BottomSheet_Poop({ 
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
  const activeDrawerSource = useAppStore(state => state.activeDrawerSource);
  const updateLogHistory = useHistoryStore(state => state.updateLogHistory);
  const deleteLogHistory = useHistoryStore(state => state.deleteLogHistory);
  
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const drawerOpen = isControlled ? open : internalOpen;

  // AI analysis drawer state
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');

  const closeRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialData?.event_time) {
      return toLocalISOString(new Date(initialData.event_time)).slice(0, 16);
    }
    return toLocalISOString(new Date()).slice(0, 16);
  });

  useEffect(() => {
    if (initialData) {
      setSelectedDate(toLocalISOString(new Date(initialData.event_time)).slice(0, 16));
    }
  }, [initialData]);

  const resetState = () => {
    if (!initialData) {
      setSelectedDate(toLocalISOString(new Date()).slice(0, 16));
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

  const fetchPoopAnalysis = async (state: string, logId: string) => {
    setAnalysisLoading(true);
    setAnalysisOpen(true);
    try {
      const res = await fetch('/api/ai/poop-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, logId }),
      });
      if (res.ok) {
        const data = await res.json() as { analysis: string | null };
        if (data.analysis) {
          setAnalysisMessage(data.analysis);
        } else {
          // No correlation found — close silently
          setAnalysisOpen(false);
        }
      } else {
        setAnalysisOpen(false);
      }
    } catch {
      setAnalysisOpen(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSave = async (state: string, primaryValue: number) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const logData = {
        event_time: toLocalISOString(new Date(selectedDate)),
        category: 'poop' as const,
        primary_value: primaryValue,
        details: { state },
        source: activeDrawerSource || undefined,
      };

      if (initialData) {
        await updateLog(initialData.id, logData);
        updateLogHistory(initialData.id, logData);
        toast.success('Registro atualizado!', {
          className: 'bg-amber-500 text-white border-transparent'
        });
        if (isControlled && onOpenChange) onOpenChange(false);
      } else {
        const result = await addLog(logData);
        toast.success('Registro salvo!', {
          className: 'bg-amber-500 text-white border-transparent'
        });

        // After saving, trigger AI analysis for non-normal states
        if (state !== 'normal') {
          const savedLogId: string = result.id ?? '';
          // Close poop drawer first, then open analysis
          if (closeRef.current) closeRef.current.click();
          if (savedLogId) fetchPoopAnalysis(state, savedLogId);
          return;
        }
      }
      
      // Auto close
      if (closeRef.current) {
        closeRef.current.click();
      }
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
        className: 'bg-amber-500 text-white border-transparent'
      });
      if (isControlled && onOpenChange) onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao apagar registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const savedAnalysis = initialData?.details?.nutri_analysis;

  return (
    <>
      <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
        {!isControlled && (
          <DrawerTrigger asChild>
            {customTrigger ? customTrigger : (
              <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
                <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
                  <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Smile className="h-8 w-8 text-amber-500" />
                  </div>
                  <p className="text-body-1 font-bold text-neutral-500 text-center px-2">Intestino</p>
                </CardContent>
              </Card>
            )}
          </DrawerTrigger>
        )}
        
        <DrawerContent className="!bg-amber-50/95 backdrop-blur-2xl border-t border-amber-200 text-amber-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
          <DrawerHeader className="px-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-title-2 text-amber-950">
                {initialData ? 'Editar Intestino' : 'Como funcionou hoje?'}
              </DrawerTitle>
              <DatePickerInput
                value={selectedDate}
                onChange={setSelectedDate}
                accentColor="text-amber-700"
                borderColor="border-amber-200"
              />
            </div>
          </DrawerHeader>

          <div className="flex flex-col mt-4 space-y-3">
            {[
              { id: 'hard', label: '🧱 Ressecado / Difícil' },
              { id: 'normal', label: '😌 Suave / Normal' },
              { id: 'liquid', label: '💦 Solto / Líquido' },
              { id: 'gas', label: '💨 Gases / Desconforto' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSave(opt.id, calculateGutScore(opt.id))}
                disabled={isSubmitting}
                className={`h-16 rounded-2xl border text-button-1 font-medium transition-colors shadow-sm active:scale-95 flex items-center justify-center disabled:opacity-60 disabled:active:scale-100 ${
                  initialData?.details.state === opt.id
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white/50 border-amber-200 text-amber-900 hover:bg-amber-100'
                }`}
              >
                {isSubmitting && initialData?.details.state === opt.id ? 'Salvando...' : opt.label}
              </button>
            ))}

            {/* Saved Nutri analysis (view mode when editing) */}
            {initialData && savedAnalysis && (
              <div className="rounded-2xl bg-white/70 border border-amber-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥗</span>
                  <p className="text-caption-1 font-bold text-amber-700 uppercase tracking-wide">
                    O que a Nutri disse
                  </p>
                </div>
                <p className="text-body-2 text-neutral-700 leading-relaxed">
                  {savedAnalysis}
                </p>
              </div>
            )}

            {initialData && (
              <div className="flex justify-start pt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-2xl border border-amber-200 bg-white/50 text-amber-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  title="Apagar registro"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
            <DrawerClose ref={closeRef} className="hidden" />
          </div>
        </DrawerContent>
      </Drawer>

      {/* AI analysis drawer — shown after a non-normal poop is saved */}
      <PoopAnalysisDrawer
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        analysis={analysisMessage}
        isLoading={analysisLoading}
      />
    </>
  );
}
