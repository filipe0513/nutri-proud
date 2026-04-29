/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, react-hooks/rules-of-hooks */
'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/store';
import { toast } from 'sonner';
import { Moon, Minus, Plus } from 'lucide-react';
import { DatePickerInput } from './DatePickerInput';

export function BottomSheet_Sleep({ customTrigger }: { customTrigger?: React.ReactNode }) {
  const addLog = useAppStore(state => state.addLog);
  
  const [duration, setDuration] = useState(8);
  const [awokeTimes, setAwokeTimes] = useState(0);
  const [quality, setQuality] = useState<'cansado' | 'normal' | 'revigorado' | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const resetState = () => {
    setDuration(8);
    setAwokeTimes(0);
    setQuality(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleSave = () => {
    if (!quality) {
      toast.error('Selecione a qualidade do sono!');
      return;
    }

    // Basic primary_value logic: 100 if > 7h and normal/revigorado
    let score = 50;
    if (duration >= 7 && quality !== 'cansado') score = 100;
    if (duration < 5 || quality === 'cansado') score = 30;

    addLog({
      event_time: `${selectedDate}T12:00:00.000Z`,
      category: 'sleep',
      primary_value: score,
      details: { 
        duration_hours: duration,
        awoke_times: awokeTimes,
        quality_feeling: quality
      }
    });

    toast.success('Sono registrado!', {
      className: 'bg-indigo-500 text-white border-transparent'
    });
    setTimeout(resetState, 300);
  };

  return (
    <Drawer onOpenChange={(open) => !open && setTimeout(resetState, 300)}>
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
      
      <DrawerContent className="!bg-indigo-50/95 backdrop-blur-2xl border-t border-indigo-200 text-indigo-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-2 text-indigo-950">
              Como foi sua noite?
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

          <DrawerClose asChild>
            <Button 
              className="h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white border-transparent w-full text-button-1 shadow-md"
              onClick={handleSave}
            >
              Salvar Sono
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
