'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
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

export function MealEqualizerDrawer() {
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

    addLog({
      event_time: new Date().toISOString(),
      category: 'food',
      primary_value: 100, // could be dynamic based on eq values
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
        <Card className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
          <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Utensils className="h-8 w-8 text-orange-500" />
            </div>
            <p className="font-bold text-slate-900 text-sm text-center px-2">Refeição</p>
          </CardContent>
        </Card>
      </DrawerTrigger>
      
      <DrawerContent className="bg-white rounded-t-[40px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-2xl font-bold">
            {!selectedMeal ? 'Qual foi a refeição?' : 'Como foi o prato?'}
          </DrawerTitle>
        </DrawerHeader>

        {!selectedMeal ? (
          <div className="flex flex-col mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {MEALS.map((meal) => (
                <Button 
                  key={meal.id}
                  variant="outline" 
                  className="h-16 rounded-2xl border-2 hover:border-slate-900 hover:bg-slate-50 flex flex-col items-center justify-center"
                  onClick={() => setSelectedMeal(meal.id)}
                >
                  <span className="font-bold">{meal.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col mt-4 space-y-6">
            <div className="flex items-center space-x-4 overflow-x-auto pb-4 no-scrollbar">
              <VerticalEqualizer label="Proteínas" value={protein} min={-10} max={10} onChange={setProtein} />
              <VerticalEqualizer label="Carbos" value={carbs} min={-10} max={10} onChange={setCarbs} />
              <VerticalEqualizer label="Gorduras" value={fats} min={-10} max={10} onChange={setFats} />
              <VerticalEqualizer label="Fibras" value={fiber} min={-10} max={10} onChange={setFiber} />
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline"
                className="h-14 rounded-2xl border-2 flex-1 font-bold"
                onClick={() => setSelectedMeal(null)}
              >
                Voltar
              </Button>
              <DrawerClose asChild>
                <Button 
                  className="h-14 rounded-2xl bg-slate-900 text-white flex-1 font-bold"
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
