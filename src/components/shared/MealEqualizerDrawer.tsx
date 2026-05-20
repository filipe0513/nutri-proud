/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/store';
import { useHistoryStore } from '@/store/historyStore';
import { toast } from 'sonner';
import { Utensils, Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { DatePickerInput } from './DatePickerInput';
import { ActivityLog } from '@/store/types';
import { ALL_MEALS } from '@/schemas/profileSchema';

/** Fallback set when the user has no planned_meals configured yet */
const FALLBACK_MEAL_IDS = ['Café da Manhã', 'Almoço', 'Jantar'];

export function MealEqualizerDrawer({ 
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
  const activityLogs = useAppStore(state => state.activity_logs);
  const userProfile = useAppStore(state => state.user_profile);
  const updateLogHistory = useHistoryStore(state => state.updateLogHistory);
  const deleteLogHistory = useHistoryStore(state => state.deleteLogHistory);
  
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const drawerOpen = isControlled ? open : internalOpen;

  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialData?.event_time) {
      return new Date(initialData.event_time).toISOString().slice(0, 16);
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  
  const getThumbColorClass = (value: number) => {
    const score = 100 - (Math.abs(value) / 50) * 100;
    if (score < 50) return 'bg-notify-error border-notify-error';
    if (score < 75) return 'bg-notify-warning border-notify-warning';
    return 'bg-notify-success border-notify-success';
  };
  
  // Equalizer states
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fats, setFats] = useState(0);
  const [fiber, setFiber] = useState(0);

  /**
   * Derive the list of meals to show in the drawer from the user's planned_meals target.
   * Falls back to the hardcoded legacy list when the profile is not yet loaded.
   */
  const mealOptions = useMemo(() => {
    const raw = (userProfile?.targets as Record<string, unknown> | undefined)?.planned_meals;
    if (Array.isArray(raw) && raw.length > 0) return raw as string[];
    return FALLBACK_MEAL_IDS;
  }, [userProfile]);

  /**
   * Compute the proportional score for one meal log.
   * 
   * Each planned meal is worth (100 / totalPlanned) points.
   * The macro quality multiplier (0–1) is derived from average absolute deviation on sliders.
   * 
   * E.g. 5 planned meals → each meal is worth 20 points at best.
   */
  const computeProportionalScore = (
    proteinVal: number,
    carbsVal: number,
    fatsVal: number,
    fiberVal: number
  ): number => {
    // Quality 0–1: how close sliders are to centre (0 = perfect)
    const avgDeviation = (Math.abs(proteinVal) + Math.abs(carbsVal) + Math.abs(fatsVal) + Math.abs(fiberVal)) / 4;
    const qualityMultiplier = Math.max(0, 1 - avgDeviation / 50);

    return Math.round(100 * qualityMultiplier);
  };

  useEffect(() => {
    if (initialData) {
      setSelectedMeal(initialData.details.meal_type || null);
      setSelectedDate(new Date(initialData.event_time).toISOString().slice(0, 16));
      
      const factors: any = initialData.details.factors || {};
      setProtein(factors.protein || 0);
      setCarbs(factors.carbs || 0);
      setFats(factors.fats || 0);
      setFiber(factors.fiber || 0);
    }
  }, [initialData]);

  const resetState = () => {
    if (!initialData) {
      setSelectedMeal(null);
      setProtein(0);
      setCarbs(0);
      setFats(0);
      setFiber(0);
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

  const handleSave = async () => {
    if (!selectedMeal) return;

    const score = computeProportionalScore(protein, carbs, fats, fiber);

    const logData = {
      event_time: new Date(selectedDate).toISOString(),
      category: 'food' as const,
      primary_value: score,
      details: { 
        meal_type: selectedMeal as any,
        factors: { protein, carbs, fats, fiber }
      }
    };

    const mealName = ALL_MEALS.find(m => m.id === selectedMeal)?.label || selectedMeal;

    if (initialData) {
      await updateLog(initialData.id, logData);
      updateLogHistory(initialData.id, logData);
      toast.success(`${mealName} atualizado!`);
      if (isControlled && onOpenChange) onOpenChange(false);
    } else {
      await addLog(logData);
      toast.success(`${mealName} registrado!`);
    }

    // Slight delay to allow drawer close animation before reset
    setTimeout(resetState, 300);
  };

  const handleDelete = async () => {
    if (!initialData) return;
    await removeLog(initialData.id);
    deleteLogHistory(initialData.id);
    toast.success('Refeição apagada!');
    if (isControlled && onOpenChange) onOpenChange(false);
  };

  /**
   * Meals already logged today for the selected date (exclude the current edit).
   */
  const alreadyLoggedToday = useMemo(() => {
    const targetDate = selectedDate.slice(0, 10);
    return activityLogs
      .filter(l => {
        if (l.category !== 'food') return false;
        if (initialData && l.id === initialData.id) return false;
        const logDate = new Date(l.event_time).toISOString().slice(0, 10);
        return logDate === targetDate;
      })
      .map(l => l.details.meal_type);
  }, [activityLogs, selectedDate, initialData]);

  return (
    <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
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
      )}
      
      <DrawerContent className="!bg-green-100/95 backdrop-blur-2xl border-t border-green-200 text-green-950 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-title-2 text-green-950">
              {initialData ? 'Editar Refeição' : (!selectedMeal ? 'Adicionar Refeição 🥗' : `Como foi o ${ALL_MEALS.find(m => m.id === selectedMeal)?.label || selectedMeal}?`)}
            </DrawerTitle>
            <DatePickerInput
              value={selectedDate}
              onChange={setSelectedDate}
              accentColor="text-green-700"
              borderColor="border-green-200"
            />
          </div>
          {selectedMeal && (
            <p className="text-body-1 text-green-900/80 mt-2">Desvio em relação ao seu plano normal.</p>
          )}
        </DrawerHeader>

        {!selectedMeal && !initialData ? (
          <div className="flex flex-col mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {mealOptions.map((meal) => {
                const alreadyLogged = alreadyLoggedToday.includes(meal);
                const mealLabel = ALL_MEALS.find(m => m.id === meal)?.label || meal;
                return (
                  <Button 
                    key={meal}
                    variant="outline" 
                    className={`h-16 rounded-2xl border bg-white/50 backdrop-blur-sm text-green-950 flex flex-col items-center justify-center transition-all ${
                      alreadyLogged
                        ? 'border-green-400 bg-green-50/60 opacity-60'
                        : 'border-green-200 hover:border-green-500 hover:bg-white/80'
                    }`}
                    onClick={() => setSelectedMeal(meal)}
                  >
                    <span className="text-button-1">{mealLabel}</span>
                    {alreadyLogged && (
                      <span className="text-xs text-green-600 mt-0.5">✓ Registrado</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col mt-4 space-y-6">
            <div className="flex flex-col space-y-6 overflow-y-auto pb-4 no-scrollbar">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-body-1 font-medium text-green-900/80">Proteínas</span>
                  <span className="text-title-3 font-bold text-green-950">{protein > 0 ? `+${protein}%` : `${protein}%`}</span>
                </div>
                <div className="w-full touch-none relative px-2">
                  <Slider value={[protein]} min={-50} max={50} step={10} onValueChange={(v) => setProtein(v[0])} thumbClassName={getThumbColorClass} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-body-1 font-medium text-green-900/80">Carbos</span>
                  <span className="text-title-3 font-bold text-green-950">{carbs > 0 ? `+${carbs}%` : `${carbs}%`}</span>
                </div>
                <div className="w-full touch-none relative px-2">
                  <Slider value={[carbs]} min={-50} max={50} step={10} onValueChange={(v) => setCarbs(v[0])} thumbClassName={getThumbColorClass} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-body-1 font-medium text-green-900/80">Gorduras</span>
                  <span className="text-title-3 font-bold text-green-950">{fats > 0 ? `+${fats}%` : `${fats}%`}</span>
                </div>
                <div className="w-full touch-none relative px-2">
                  <Slider value={[fats]} min={-50} max={50} step={10} onValueChange={(v) => setFats(v[0])} thumbClassName={getThumbColorClass} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-body-1 font-medium text-green-900/80">Fibras</span>
                  <span className="text-title-3 font-bold text-green-950">{fiber > 0 ? `+${fiber}%` : `${fiber}%`}</span>
                </div>
                <div className="w-full touch-none relative px-2">
                  <Slider value={[fiber]} min={-50} max={50} step={10} onValueChange={(v) => setFiber(v[0])} thumbClassName={getThumbColorClass} />
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {initialData && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border border-green-200 bg-white/50 text-green-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 flex-shrink-0"
                  onClick={handleDelete}
                  title="Apagar registro"
                >
                  <Trash2 size={18} />
                </Button>
              )}
              {!initialData && (
                <Button 
                  variant="outline"
                  className="h-14 rounded-2xl border border-green-200 bg-white/50 backdrop-blur-sm text-green-900 hover:bg-white/80 flex-1 text-button-1 shadow-sm"
                  onClick={() => setSelectedMeal(null)}
                >
                  Voltar
                </Button>
              )}
              {initialData ? (
                <Button 
                  className="h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white border-transparent flex-1 text-button-1 shadow-md"
                  onClick={handleSave}
                >
                  Salvar
                </Button>
              ) : (
                <DrawerClose asChild>
                  <Button 
                    className="h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white border-transparent flex-1 text-button-1 shadow-md"
                    onClick={handleSave}
                  >
                    Confirmar
                  </Button>
                </DrawerClose>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
