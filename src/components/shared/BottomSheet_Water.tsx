/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/store';
import { useHistoryStore } from '@/store/historyStore';
import { toast } from 'sonner';
import { Droplet, Trophy, Trash2 } from 'lucide-react';
import { DatePickerInput } from './DatePickerInput';
import { ActivityLog } from '@/store/types';
import { toLocalISOString } from '@/lib/utils';

export function BottomSheet_Water({ 
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
  const setWaterToTarget = useAppStore(state => state.setWaterToTarget);
  const userProfile = useAppStore(state => state.user_profile);
  
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const drawerOpen = isControlled ? open : internalOpen;

  const [customInput, setCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialData?.event_time) {
      return new Date(initialData.event_time).toISOString().slice(0, 16);
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  
  const closeRef = useRef<HTMLButtonElement>(null);

  const targetMl = userProfile?.targets?.water_ml_per_day || 2000;

  useEffect(() => {
    if (initialData) {
      setCustomInput(true);
      setCustomValue(String(initialData.details.quantity_ml || ''));
      setSelectedDate(new Date(initialData.event_time).toISOString().slice(0, 16));
    }
  }, [initialData]);

  const handleSave = async (ml: number) => {
    const score = Math.min(100, Math.round((ml / targetMl) * 100));
    const logData = {
      event_time: toLocalISOString(new Date(selectedDate)),
      category: 'water' as const,
      primary_value: score,
      details: { quantity_ml: ml }
    };

    if (initialData) {
      await updateLog(initialData.id, logData);
      updateLogHistory(initialData.id, logData);
      toast.success(`Água atualizada para ${ml}ml!`, {
        className: 'bg-blue-500 text-white border-transparent'
      });
    } else {
      await addLog(logData);
      toast.success(`${ml}ml registrados!`, {
        className: 'bg-blue-500 text-white border-transparent'
      });
    }
    
    closeDrawer();
  };

  const handleDelete = async () => {
    if (!initialData) return;
    await removeLog(initialData.id);
    deleteLogHistory(initialData.id);
    toast.success('Registro apagado!', {
      className: 'bg-blue-500 text-white border-transparent'
    });
    closeDrawer();
  };

  const handleTargetHit = async () => {
    await setWaterToTarget(selectedDate);
    toast.success('Meta de Água Batida!', {
      description: 'Orgulho da Nutri! 👏',
      className: 'bg-orange-500 text-white border-transparent'
    });
    closeDrawer();
  };

  const closeDrawer = () => {
    if (closeRef.current) closeRef.current.click();
    if (isControlled && onOpenChange) {
      onOpenChange(false);
    } else {
      setInternalOpen(false);
    }
    setTimeout(() => {
      if (!initialData) {
        setCustomInput(false);
        setCustomValue('');
        const now = new Date();
        setSelectedDate(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      }
    }, 300);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
    if (!newOpen) {
      setTimeout(() => {
        if (!initialData) {
          setCustomInput(false);
          setCustomValue('');
          const now = new Date();
          setSelectedDate(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }
      }, 300);
    }
  };

  return (
    <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DrawerTrigger asChild>
          {customTrigger ? customTrigger : (
            <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
              <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Droplet className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-body-1 font-bold text-neutral-500 text-center px-2">Água</p>
              </CardContent>
            </Card>
          )}
        </DrawerTrigger>
      )}
      
      <DrawerContent className="!bg-blue-50/95 backdrop-blur-2xl border-t border-blue-200 text-blue-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-2 text-blue-950">
              {initialData ? 'Editar Água' : (customInput ? 'Digitar quantidade (ml)' : 'Quanto você bebeu?')}
            </DrawerTitle>
            <DatePickerInput
              value={selectedDate}
              onChange={setSelectedDate}
              accentColor="text-blue-700"
              borderColor="border-blue-200"
            />
          </div>
        </DrawerHeader>

        {!customInput && !initialData ? (
          <div className="flex flex-col mt-4 space-y-4">
            
            {/* Target Button */}
            <Button 
              onClick={handleTargetHit}
              className="h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white border-transparent flex flex-col items-center justify-center shadow-lg transform transition-transform active:scale-95"
            >
              <div className="flex items-center space-x-2">
                <Trophy size={20} />
                <span className="text-button-1 font-bold">Bater Meta do Dia 💧</span>
              </div>
              <span className="text-caption-2 text-white/80">Registrar {targetMl}ml de uma vez</span>
            </Button>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '250ml (Copo)', value: 250 },
                { label: '500ml (Garrafa)', value: 500 },
                { label: '1L (Jarra)', value: 1000 },
              ].map((opt, i) => (
                <Button 
                  key={i}
                  variant="outline" 
                  className="h-16 rounded-2xl border border-blue-200 bg-white/50 backdrop-blur-sm hover:border-blue-500 hover:bg-white/80 text-blue-950 flex flex-col items-center justify-center"
                  onClick={() => handleSave(opt.value)}
                >
                  <span className="text-button-1">{opt.label}</span>
                </Button>
              ))}
              
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl border border-blue-200 bg-white/50 backdrop-blur-sm hover:border-blue-500 hover:bg-white/80 text-blue-950 flex flex-col items-center justify-center"
                onClick={() => setCustomInput(true)}
              >
                <span className="text-button-1">Outro</span>
              </Button>
            </div>
            <DrawerClose ref={closeRef} className="hidden" />
          </div>
        ) : (
          <div className="flex flex-col mt-4 space-y-6">
            <div className="flex items-center space-x-3 min-w-0">
              <input 
                type="number" 
                inputMode="numeric"
                className="min-w-0 flex-1 h-16 rounded-2xl border border-blue-200 bg-white/50 backdrop-blur-sm px-4 text-title-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-blue-950"
                placeholder="0"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                autoFocus
              />
              <span className="text-title-2 text-blue-900/80 flex-shrink-0">ml</span>
            </div>
            
            <div className="flex space-x-2">
              {initialData && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border border-blue-200 bg-white/50 text-blue-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 flex-shrink-0"
                  onClick={handleDelete}
                  title="Apagar registro"
                >
                  <Trash2 size={18} />
                </Button>
              )}
              {!initialData && (
                <Button 
                  variant="outline"
                  className="h-14 rounded-2xl border border-blue-200 bg-white/50 backdrop-blur-sm text-blue-900 hover:bg-white/80 flex-1 text-button-1 shadow-sm"
                  onClick={() => setCustomInput(false)}
                >
                  Voltar
                </Button>
              )}
              <Button 
                className="h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white border-transparent flex-1 text-button-1 shadow-md"
                onClick={() => {
                  if(customValue && !isNaN(Number(customValue))) {
                    handleSave(Number(customValue));
                  }
                }}
              >
                {initialData ? 'Salvar' : 'Confirmar'}
              </Button>
              <DrawerClose ref={closeRef} className="hidden" />
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
