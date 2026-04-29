'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/store';
import { toast } from 'sonner';
import { Smile } from 'lucide-react';
import { useRef, useState } from 'react';
import { DatePickerInput } from './DatePickerInput';

export function BottomSheet_Poop({ customTrigger }: { customTrigger?: React.ReactNode }) {
  const addLog = useAppStore(state => state.addLog);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = (state: string, primaryValue: number) => {
    addLog({
      event_time: `${selectedDate}T12:00:00.000Z`,
      category: 'poop',
      primary_value: primaryValue,
      details: { state }
    });

    toast.success('Registro salvo!', {
      className: 'bg-amber-500 text-white border-transparent'
    });
    
    // Auto close
    if (closeRef.current) {
      closeRef.current.click();
    }
  };

  return (
    <Drawer>
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
      
      <DrawerContent className="!bg-amber-50/95 backdrop-blur-2xl border-t border-amber-200 text-amber-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-2 text-amber-950">
              Como funcionou hoje?
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
            { id: 'hard', label: '🧱 Ressecado / Difícil', pv: 25 },
            { id: 'normal', label: '😌 Suave / Normal', pv: 100 },
            { id: 'liquid', label: '💦 Solto / Líquido', pv: 25 },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSave(opt.id, opt.pv)}
              className="h-16 rounded-2xl bg-white/50 border border-amber-200 text-amber-900 font-medium text-button-1 hover:bg-amber-100 transition-colors shadow-sm active:scale-95 flex items-center justify-center"
            >
              {opt.label}
            </button>
          ))}
          <DrawerClose ref={closeRef} className="hidden" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
