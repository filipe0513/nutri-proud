/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplet, Moon, Utensils, Dumbbell, Smile, CheckCircle2, Lightbulb, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/store';

// Aqui eu importo os drawers existentes, mas vou precisar controla-los de fora ou replicar a chamada.
// Como o Drawer do Shadcn pode ser controlado por estado global ou id, vamos passar um trigger customizado.
import { BottomSheet_Water } from '@/components/shared/BottomSheet_Water';
import { BottomSheet_Sleep } from '@/components/shared/BottomSheet_Sleep';
import { BottomSheet_Poop } from '@/components/shared/BottomSheet_Poop';
import { WorkoutEqualizerDrawer } from '@/components/shared/WorkoutEqualizerDrawer';
import { MealEqualizerDrawer } from '@/components/shared/MealEqualizerDrawer';

// Dados Educacionais Estáticos
const PILLAR_DATA: Record<string, any> = {
  water: {
    title: 'Hidratação',
    icon: Droplet,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-50',
    ctaColor: 'bg-blue-500 hover:bg-blue-600',
    why: ['⚡ Acelera o metabolismo', '🧠 Melhora o foco e cognição', '💧 Limpa toxinas do corpo'],
    how: ['Deixe uma garrafa na mesa', 'Beba um copo cheio ao acordar', 'Beba antes de sentir sede'],
    DrawerComponent: BottomSheet_Water,
  },
  sleep: {
    title: 'Qualidade do Sono',
    icon: Moon,
    colorClass: 'text-indigo-500',
    bgClass: 'bg-indigo-50',
    ctaColor: 'bg-indigo-500 hover:bg-indigo-600',
    why: ['🔋 Restaura energia e músculos', '😌 Reduz estresse e ansiedade', '🛡️ Fortalece o sistema imune'],
    how: ['Evite telas 1h antes de deitar', 'Mantenha o quarto escuro e frio', 'Tenha horário fixo para dormir'],
    DrawerComponent: BottomSheet_Sleep,
  },
  food: {
    title: 'Alimentação',
    icon: Utensils,
    colorClass: 'text-green-500',
    bgClass: 'bg-green-50',
    ctaColor: 'bg-green-500 hover:bg-green-600',
    why: ['🧱 Fornece blocos de construção muscular', '🔥 Combustível para o dia', '🦠 Nutre a flora intestinal'],
    how: ['Priorize alimentos integrais', 'Coma proteína em todas refeições', 'Evite ultraprocessados'],
    DrawerComponent: MealEqualizerDrawer,
  },
  workout: {
    title: 'Treinamento',
    icon: Dumbbell,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-50',
    ctaColor: 'bg-red-500 hover:bg-red-600',
    why: ['💪 Constrói massa magra', '🦴 Fortalece ossos e articulações', '❤️ Protege o coração'],
    how: ['Aqueça antes de começar', 'Priorize a execução correta', 'Descanse entre os treinos'],
    DrawerComponent: WorkoutEqualizerDrawer,
  },
  poop: {
    title: 'Saúde Intestinal',
    icon: Smile,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    ctaColor: 'bg-amber-600 hover:bg-amber-700',
    why: ['🧠 Produz 90% da serotonina', '🛡️ É a base da imunidade', '💩 Elimina o que não serve mais'],
    how: ['Coma mais fibras (frutas/veg)', 'Beba muita água', 'Movimente o corpo diariamente'],
    DrawerComponent: BottomSheet_Poop,
  }
};

export default function PillarInsightsPage() {
  const { category } = useParams();
  const catKey = category as string;
  const data = PILLAR_DATA[catKey];
  const { user_profile } = useAppStore();

  const targetText = useMemo(() => {
    if (!user_profile) return '';
    if (catKey === 'water') return `Meta: ${user_profile.targets.water_ml_per_day}ml / dia`;
    if (catKey === 'food') return `Meta: ${user_profile.targets.meals_per_day} refs / dia`;
    if (catKey === 'sleep') return `Meta: ${user_profile.targets.sleep_hours_per_night}h / noite`;
    if (catKey === 'workout') return `Meta: ${user_profile.targets.weekly_workouts} treinos / sem`;
    return '1x ao dia é o ideal';
  }, [user_profile, catKey]);

  if (!data) return notFound();

  const Icon = data.icon;
  const DrawerComp = data.DrawerComponent;

  return (
    <div className={`min-h-screen pb-32`}>
      {/* Hero Section */}
      <div className={`${data.bgClass} pt-12 pb-16 px-6 rounded-b-[40px] relative`}>
        <div className="absolute top-8 left-6">
          <Link href="/" className="h-10 w-10 bg-white/50 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-neutral-500 hover:scale-105 transition-transform">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center mt-8 space-y-4">
          <div className="h-24 w-24 rounded-full bg-white/80 shadow-sm flex items-center justify-center">
            <Icon className={`h-12 w-12 ${data.colorClass}`} />
          </div>
          <div className="text-center">
            <h1 className="text-title-1 font-bold text-neutral-800">{data.title}</h1>
            <p className="text-body-1 font-medium text-neutral-500 mt-1">{targetText}</p>
          </div>
        </div>
      </div>

      {/* Body / Bullets */}
      <div className="px-6 py-8 space-y-6 max-w-lg mx-auto">
        
        {/* Why matters */}
        <Card className="bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-title-3 font-bold text-neutral-600">Por que importa?</h2>
            <ul className="space-y-3">
              {data.why.map((item: string, i: number) => (
                <li key={i} className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-body-2 text-neutral-500 font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* How to achieve */}
        <Card className="bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-title-3 font-bold text-neutral-600">Como atingir a meta?</h2>
            <ul className="space-y-3">
              {data.how.map((item: string, i: number) => (
                <li key={i} className="flex items-start space-x-3">
                  <Lightbulb className="h-6 w-6 text-orange-400 flex-shrink-0" />
                  <span className="text-body-2 text-neutral-500 font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-light via-bg-light/90 to-transparent flex justify-center z-50">
        <div className="w-full max-w-lg">
          <DrawerComp customTrigger={
            <Button 
                className={`w-full h-16 rounded-2xl text-white font-bold text-title-3 shadow-lg ${data.ctaColor}`}
            >
                Registrar {data.title}
            </Button>
          } />
        </div>
      </div>
    </div>
  );
}
