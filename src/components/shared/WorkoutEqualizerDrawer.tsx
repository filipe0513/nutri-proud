/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/store';
import { useHistoryStore } from '@/store/historyStore';
import { toast } from 'sonner';
import { Dumbbell, Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { DatePickerInput } from './DatePickerInput';
import { ActivityLog } from '@/store/types';
import { toLocalISOString } from '@/lib/utils';
import { calculateTrainingScore } from '@/utils/scoreUtils';

export function WorkoutEqualizerDrawer({ 
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

  // Equalizer states
  const [cardio, setCardio] = useState(0);
  const [carga, setCarga] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialData?.event_time) {
      return toLocalISOString(new Date(initialData.event_time)).slice(0, 16);
    }
    return toLocalISOString(new Date()).slice(0, 16);
  });

  const getThumbColorClass = (value: number) => {
    const score = 100 - (Math.abs(value) / 50) * 100;
    if (score < 50) return 'bg-notify-error border-notify-error';
    if (score < 75) return 'bg-notify-warning border-notify-warning';
    return 'bg-notify-success border-notify-success';
  };

  useEffect(() => {
    if (initialData) {
      const details = initialData.details as any;
      const f: any = details.factors || {};
      setCardio(f.cardio || 0);
      setCarga(f.carga || 0);
      setSelectedDate(toLocalISOString(new Date(initialData.event_time)).slice(0, 16));
    }
  }, [initialData]);

  const resetState = () => {
    if (!initialData) {
      setCardio(0);
      setCarga(0);
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

  const handleSave = async () => {
    const score = calculateTrainingScore(cardio, carga);

    const logData = {
      event_time: toLocalISOString(new Date(selectedDate)),
      category: 'workout' as const,
      primary_value: score,
      details: { 
        factors: { cardio, carga }
      },
      source: activeDrawerSource || undefined,
    };

    if (initialData) {
      await updateLog(initialData.id, logData);
      updateLogHistory(initialData.id, logData);
      toast.success('Treino atualizado com sucesso!');
      if (isControlled && onOpenChange) onOpenChange(false);
    } else {
      await addLog(logData);
      toast.success('Treino registrado com sucesso!');
    }

    setTimeout(resetState, 300);
  };

  const handleDelete = async () => {
    if (!initialData) return;
    await removeLog(initialData.id);
    deleteLogHistory(initialData.id);
    toast.success('Treino apagado!');
    if (isControlled && onOpenChange) onOpenChange(false);
  };

  return (
    <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DrawerTrigger asChild>
          {customTrigger ? customTrigger : (
            <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
              <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Dumbbell className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-body-1 font-bold text-neutral-500 text-center px-2">Treino</p>
              </CardContent>
            </Card>
          )}
        </DrawerTrigger>
      )}
      
      <DrawerContent className="!bg-red-50/95 backdrop-blur-2xl border-t border-red-200 text-red-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-2 text-red-950">
              {initialData ? 'Editar Treino' : 'Como foi o treino?'}
            </DrawerTitle>
            <DatePickerInput
              value={selectedDate}
              onChange={setSelectedDate}
              accentColor="text-red-700"
              borderColor="border-red-200"
            />
          </div>
          <p className="text-body-1 text-red-900/80 mt-2">Desvio em relação ao seu plano normal.</p>
        </DrawerHeader>

        <div className="flex flex-col mt-4 space-y-6">
          <div className="flex flex-col space-y-6 overflow-y-auto pb-4 no-scrollbar">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body-1 font-medium text-red-900/80">Cardio</span>
                <span className="text-title-3 font-bold text-red-950">{cardio > 0 ? `+${cardio}%` : `${cardio}%`}</span>
              </div>
              <div className="w-full touch-none relative px-2">
                <Slider value={[cardio]} min={-50} max={50} step={10} onValueChange={(v) => setCardio(v[0])} thumbClassName={getThumbColorClass} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body-1 font-medium text-red-900/80">Carga</span>
                <span className="text-title-3 font-bold text-red-950">{carga > 0 ? `+${carga}%` : `${carga}%`}</span>
              </div>
              <div className="w-full touch-none relative px-2">
                <Slider value={[carga]} min={-50} max={50} step={10} onValueChange={(v) => setCarga(v[0])} thumbClassName={getThumbColorClass} />
              </div>
            </div>
          </div>

          {initialData ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-2xl border border-red-200 bg-white/50 text-red-400 hover:text-red-600 hover:border-red-400 hover:bg-red-50 flex-shrink-0"
                onClick={handleDelete}
                title="Apagar registro"
              >
                <Trash2 size={18} />
              </Button>
              <Button 
                className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white border-transparent flex-1 text-button-1 shadow-md"
                onClick={handleSave}
              >
                Salvar
              </Button>
            </div>
          ) : (
            <DrawerClose asChild>
              <Button 
                className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white border-transparent w-full text-button-1 shadow-md"
                onClick={handleSave}
              >
                Confirmar
              </Button>
            </DrawerClose>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
