/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, react-hooks/rules-of-hooks */
'use client';

import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SlidersHorizontal, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useHistoryStore } from '@/store/historyStore';
import { Category } from '@/store/types';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'water', label: '💧 Água' },
  { id: 'food', label: '🥗 Comida' },
  { id: 'workout', label: '🏋️ Treino' },
  { id: 'sleep', label: '🌙 Sono' },
  { id: 'poop', label: '💩 Intestino' },
];

export function FilterDrawer() {
  const { filters, applyFilters } = useHistoryStore();
  const [open, setOpen] = useState(false);
  
  // Local state for the form inside drawer
  const [localCategories, setLocalCategories] = useState<Category[]>(filters.categories);
  const [dateRange, setDateRange] = useState<{from: Date | undefined; to?: Date | undefined}>({
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  });

  // Sync local state when opening
  useEffect(() => {
    if (open) {
      setLocalCategories(filters.categories);
      setDateRange({
        from: filters.startDate ? new Date(filters.startDate) : undefined,
        to: filters.endDate ? new Date(filters.endDate) : undefined,
      });
    }
  }, [open, filters]);

  const toggleCategory = (cat: Category) => {
    setLocalCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleApply = () => {
    applyFilters({
      categories: localCategories,
      startDate: dateRange.from ? dateRange.from.toISOString() : null,
      endDate: dateRange.to ? dateRange.to.toISOString() : null,
    });
    setOpen(false);
  };

  const handleClear = () => {
    applyFilters({ categories: [], startDate: null, endDate: null });
    setOpen(false);
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.startDate;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <div className="flex items-center space-x-2">
        {hasActiveFilters && (
          <button 
            onClick={() => applyFilters({ categories: [], startDate: null, endDate: null })}
            className="text-caption-1 font-medium text-neutral-400 hover:text-neutral-500 transition-colors"
          >
            (Limpar)
          </button>
        )}
        <DrawerTrigger asChild>
          <button className="relative h-10 w-10 bg-glass-light-2 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-neutral-500 hover:scale-105 transition-transform">
            <SlidersHorizontal size={20} />
            {hasActiveFilters && (
              <span className="absolute top-0 right-0 h-3 w-3 bg-orange-500 rounded-full border-2 border-bg-light" />
            )}
          </button>
        </DrawerTrigger>
      </div>

      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-2 text-neutral-500">
            Filtros do Histórico
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col mt-4 space-y-6">
          
          {/* Categorias */}
          <div className="space-y-3">
            <h3 className="text-body-1 font-bold text-neutral-500/80">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const isActive = localCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-caption-1 font-medium transition-colors border ${
                      isActive 
                        ? 'bg-orange-500 text-white border-orange-600 shadow-sm' 
                        : 'bg-glass-light-2 text-neutral-500 border-white/40 hover:bg-glass-light-3'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-3">
            <h3 className="text-body-1 font-bold text-neutral-500/80">Período</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start text-left font-normal bg-glass-light-2 border-white/40 rounded-2xl text-neutral-500 text-button-1"
                >
                  <CalendarIcon className="mr-2 h-5 w-5 opacity-70" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "d 'de' MMM", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "d 'de' MMM", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "d 'de' MMM", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione um período...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-white/40 bg-white/95 backdrop-blur-xl shadow-lg" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range)}
                  numberOfMonths={1}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline"
              className="h-14 rounded-2xl border border-white/40 bg-glass-light-2 backdrop-blur-sm text-neutral-500 hover:bg-glass-light-3 flex-1 text-button-1"
              onClick={handleClear}
            >
              Limpar
            </Button>
            <Button 
              className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white flex-1 text-button-1 shadow-md border-transparent"
              onClick={handleApply}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
