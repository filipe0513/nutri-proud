'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Dumbbell } from 'lucide-react';
import { VerticalEqualizer } from './VerticalEqualizer';

export function WorkoutEqualizerDrawer() {
  const addLog = useAppStore(state => state.addLog);
  
  // Equalizer states
  const [cardio, setCardio] = useState(0);
  const [carga, setCarga] = useState(0);

  const resetState = () => {
    setCardio(0);
    setCarga(0);
  };

  const handleSave = () => {
    addLog({
      event_time: new Date().toISOString(),
      category: 'workout',
      primary_value: 100,
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
        <Card className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
          <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Dumbbell className="h-8 w-8 text-red-500" />
            </div>
            <p className="font-bold text-slate-900 text-sm text-center px-2">Treino</p>
          </CardContent>
        </Card>
      </DrawerTrigger>
      
      <DrawerContent className="bg-white rounded-t-[40px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-2xl font-bold">
            Como foi o treino?
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col mt-4 space-y-6">
          <div className="flex justify-center space-x-8 overflow-x-auto pb-4 no-scrollbar">
            <VerticalEqualizer label="Cardio" value={cardio} min={-10} max={10} onChange={setCardio} />
            <VerticalEqualizer label="Carga" value={carga} min={-10} max={10} onChange={setCarga} />
          </div>

          <DrawerClose asChild>
            <Button 
              className="h-14 rounded-2xl bg-slate-900 text-white w-full font-bold"
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
