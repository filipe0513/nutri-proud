/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, react-hooks/rules-of-hooks */
'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/store';
import { toast } from 'sonner';
import { Utensils } from 'lucide-react';
import { VerticalEqualizer } from './VerticalEqualizer';

const MEALS = [
  { id: 'breakfast', label: 'Café da manhã' },
  { id: 'morning_snack', label: 'Lanche da manhã' },
  { id: 'lunch', label: 'Almoço' },
  { id: 'dessert', label: 'Sobremesa' },
  { id: 'afternoon_snack', label: 'Lanche da tarde' },
  { id: 'dinner', label: 'Jantar' }
];

export function MealEqualizerDrawer({ customTrigger }: { customTrigger?: React.ReactNode }) {
  const addLog = useAppStore(state => state.addLog);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  
  // Equalizer states
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fats, setFats] = useState(0);
  const [fiber, setFiber] = useState(0);

  const resetState = () => {
    setSelectedMeal(null);
    setProtein(0);
    setCarbs(0);
    setFats(0);
    setFiber(0);
  };

  const handleSave = () => {
    if (!selectedMeal) return;

    const avgDeviation = (Math.abs(protein) + Math.abs(carbs) + Math.abs(fats) + Math.abs(fiber)) / 4;
    const score = Math.max(0, Math.round(100 - (avgDeviation / 50) * 100));

    addLog({
      event_time: new Date().toISOString(),
      category: 'food',
      primary_value: score,
      details: { 
        meal_type: selectedMeal as any,
        factors: { protein, carbs, fats, fiber }
      }
    });

    const mealName = MEALS.find(m => m.id === selectedMeal)?.label;
    toast.success(`${mealName} registrado!`);
    
    // Slight delay to allow drawer close animation before reset
    setTimeout(resetState, 300);
  };

  return (
    <Drawer onOpenChange={(open) => !open && setTimeout(resetState, 300)}>
      <DrawerTrigger asChild>
        {customTrigger ? customTrigger : (
          <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
            <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Utensils className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-body-1 font-bold text-neutral-500 text-center px-2">Refeição</p>
            </CardContent>
          </Card>
        )}
      </DrawerTrigger>
      
      <DrawerContent className="!bg-green-50/95 backdrop-blur-2xl border-t border-green-200 text-green-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-2 text-green-950">
            {!selectedMeal ? 'Adicionar Refeição 🥗' : `Como foi o ${MEALS.find(m => m.id === selectedMeal)?.label}?`}
          </DrawerTitle>
          {selectedMeal && (
            <p className="text-body-1 text-green-900/80 mt-2">Desvio em relação ao seu plano normal.</p>
          )}
        </DrawerHeader>

        {!selectedMeal ? (
          <div className="flex flex-col mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {MEALS.map((meal) => (
                <Button 
                  key={meal.id}
                  variant="outline" 
                  className="h-16 rounded-2xl border border-green-200 bg-white/50 backdrop-blur-sm hover:border-green-500 hover:bg-white/80 text-green-950 flex flex-col items-center justify-center"
                  onClick={() => setSelectedMeal(meal.id)}
                >
                  <span className="text-button-1">{meal.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col mt-4 space-y-6">
            <div className="flex items-center space-x-4 overflow-x-auto pb-4 no-scrollbar">
              <VerticalEqualizer label="Proteínas" value={protein} min={-50} max={50} step={10} onChange={setProtein} />
              <VerticalEqualizer label="Carbos" value={carbs} min={-50} max={50} step={10} onChange={setCarbs} />
              <VerticalEqualizer label="Gorduras" value={fats} min={-50} max={50} step={10} onChange={setFats} />
              <VerticalEqualizer label="Fibras" value={fiber} min={-50} max={50} step={10} onChange={setFiber} />
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline"
                className="h-14 rounded-2xl border border-green-200 bg-white/50 backdrop-blur-sm text-green-900 hover:bg-white/80 flex-1 text-button-1 shadow-sm"
                onClick={() => setSelectedMeal(null)}
              >
                Voltar
              </Button>
              <DrawerClose asChild>
                <Button 
                  className="h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white border-transparent flex-1 text-button-1 shadow-md"
                  onClick={handleSave}
                >
                  Confirmar
                </Button>
              </DrawerClose>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
