'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/store';
import { toast } from 'sonner';
import { Dumbbell } from 'lucide-react';
import { VerticalEqualizer } from './VerticalEqualizer';
import { DatePickerInput } from './DatePickerInput';

export function WorkoutEqualizerDrawer({ customTrigger }: { customTrigger?: React.ReactNode }) {
  const addLog = useAppStore(state => state.addLog);
  
  // Equalizer states
  const [cardio, setCardio] = useState(0);
  const [carga, setCarga] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const resetState = () => {
    setCardio(0);
    setCarga(0);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleSave = () => {
    const avgDeviation = (Math.abs(cardio) + Math.abs(carga)) / 2;
    const score = Math.max(0, Math.round(100 - (avgDeviation / 50) * 100));

    addLog({
      event_time: `${selectedDate}T12:00:00.000Z`,
      category: 'workout',
      primary_value: score,
      details: { 
        factors: { cardio, carga }
      }
    });

    toast.success('Treino registrado com sucesso!');
    setTimeout(resetState, 300);
  };

  return (
    <Drawer onOpenChange={(open) => !open && setTimeout(resetState, 300)}>
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
      
      <DrawerContent className="!bg-red-50/95 backdrop-blur-2xl border-t border-red-200 text-red-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-2 text-red-950">
              Como foi o treino?
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
          <div className="flex justify-center space-x-8 overflow-x-auto pb-4 no-scrollbar">
            <VerticalEqualizer label="Cardio" value={cardio} min={-50} max={50} step={10} onChange={setCardio} />
            <VerticalEqualizer label="Carga" value={carga} min={-50} max={50} step={10} onChange={setCarga} />
          </div>

          <DrawerClose asChild>
            <Button 
              className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white border-transparent w-full text-button-1 shadow-md"
              onClick={handleSave}
            >
              Confirmar
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
