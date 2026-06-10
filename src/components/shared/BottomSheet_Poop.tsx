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
  const updateLogHistory = useHistoryStore(state => state.updateLogHistory);
  const deleteLogHistory = useHistoryStore(state => state.deleteLogHistory);
  
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const drawerOpen = isControlled ? open : internalOpen;

  const closeRef = useRef<HTMLButtonElement>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialData?.event_time) {
      return new Date(initialData.event_time).toISOString().slice(0, 16);
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  useEffect(() => {
    if (initialData) {
      setSelectedDate(new Date(initialData.event_time).toISOString().slice(0, 16));
    }
  }, [initialData]);

  const resetState = () => {
    if (!initialData) {
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

  const handleSave = async (state: string, primaryValue: number) => {
    const logData = {
      event_time: toLocalISOString(new Date(selectedDate)),
      category: 'poop' as const,
      primary_value: primaryValue,
      details: { state }
    };

    if (initialData) {
      await updateLog(initialData.id, logData);
      updateLogHistory(initialData.id, logData);
      toast.success('Registro atualizado!', {
        className: 'bg-amber-500 text-white border-transparent'
      });
      if (isControlled && onOpenChange) onOpenChange(false);
    } else {
      await addLog(logData);
      toast.success('Registro salvo!', {
        className: 'bg-amber-500 text-white border-transparent'
      });
    }
    
    // Auto close
    if (closeRef.current) {
      closeRef.current.click();
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    await removeLog(initialData.id);
    deleteLogHistory(initialData.id);
    toast.success('Registro apagado!', {
      className: 'bg-amber-500 text-white border-transparent'
    });
    if (isControlled && onOpenChange) onOpenChange(false);
  };

  return (
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
              className={`h-16 rounded-2xl border text-button-1 font-medium transition-colors shadow-sm active:scale-95 flex items-center justify-center ${
                initialData?.details.state === opt.id
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white/50 border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {initialData && (
            <div className="flex justify-start pt-2">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-2xl border border-amber-200 bg-white/50 text-amber-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50"
                onClick={handleDelete}
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
  );
}
