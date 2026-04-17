'use client';

import { useState } from 'react';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { LucideIcon } from 'lucide-react';
import { Category } from '@/types';

export interface ActionOption {
  label: string;
  value: any;
  primaryValue: number;
  suffix?: string; // used for custom inputs (e.g. 'ml', 'h')
}

interface ActionCardWithDrawerProps {
  category: Category;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
  title: string;
  subtitle?: string;
  drawerTitle: string;
  options: ActionOption[];
  onLogDetails?: (value: any) => any;
}

export function ActionCardWithDrawer({
  category,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  title,
  subtitle,
  drawerTitle,
  options,
  onLogDetails = (v) => ({ value: v })
}: ActionCardWithDrawerProps) {
  const addLog = useAppStore(state => state.addLog);
  const [customStep, setCustomStep] = useState<ActionOption | null>(null);
  const [customValue, setCustomValue] = useState<string>('');

  const handleAction = (opt: ActionOption) => {
    if (opt.value === 'custom') {
      setCustomStep(opt);
      setCustomValue('');
      return;
    }
    executeLog(opt, opt.value);
  };

  const executeLog = (opt: ActionOption, finalValue: any) => {
    addLog({
      event_time: new Date().toISOString(),
      category: category,
      primary_value: opt.primaryValue,
      details: onLogDetails(finalValue)
    });
    toast.success(`${opt.label} registrado!`);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Card className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group aspect-square flex flex-col items-center justify-center">
          <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
            <div className={`h-16 w-16 rounded-2xl ${iconBgClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon className={`h-8 w-8 ${iconColorClass}`} />
            </div>
            <p className="font-bold text-slate-900 text-sm text-center px-2">{title}</p>
          </CardContent>
        </Card>
      </DrawerTrigger>
      <DrawerContent className="bg-white rounded-t-[40px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-2xl font-bold">
            {customStep ? `Digitar quantidade (${customStep.suffix || ''})` : drawerTitle}
          </DrawerTitle>
        </DrawerHeader>
        
        {!customStep ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {options.map((opt, i) => {
              if (opt.value === 'custom') {
                return (
                  <Button 
                    key={i}
                    variant="outline" 
                    className="h-20 rounded-2xl border-2 hover:border-slate-900 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1"
                    onClick={() => handleAction(opt)}
                  >
                    <span className="font-bold">{opt.label}</span>
                  </Button>
                );
              }
              
              return (
                <DrawerClose asChild key={i}>
                  <Button 
                    variant="outline" 
                    className="h-20 rounded-2xl border-2 hover:border-slate-900 hover:bg-slate-50 flex flex-col items-center justify-center space-y-1"
                    onClick={() => handleAction(opt)}
                  >
                    <span className="font-bold">{opt.label}</span>
                  </Button>
                </DrawerClose>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col mt-4 space-y-4">
            <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
              <input 
                type="number"
                className="flex-1 bg-transparent text-2xl font-bold text-slate-900 focus:outline-none h-14"
                placeholder="0"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                autoFocus
              />
              {customStep.suffix && (
                <span className="text-xl font-bold text-slate-400">{customStep.suffix}</span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                className="h-14 rounded-2xl border-2 flex-1 font-bold"
                onClick={() => setCustomStep(null)}
              >
                Voltar
              </Button>
              <DrawerClose asChild>
                <Button 
                  className="h-14 rounded-2xl bg-slate-900 text-white flex-1 font-bold"
                  onClick={() => {
                    const val = Number(customValue);
                    if (val > 0) {
                      executeLog(customStep, val);
                    }
                    setTimeout(() => setCustomStep(null), 300); // reset after closing
                  }}
                  disabled={!customValue || Number(customValue) <= 0}
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
