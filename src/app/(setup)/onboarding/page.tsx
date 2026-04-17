'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { UserProfile } from '@/types';

type Step = 'name' | 'goal' | 'stats' | 'calculating';

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useAppStore((state) => state.setProfile);
  
  const [step, setStep] = useState<Step>('name');
  const [formData, setFormData] = useState({
    name: '',
    goal: 'health' as UserProfile['profile']['main_goal'],
    weight: '',
    height: '',
    gender: 'male' as UserProfile['profile']['gender'],
  });

  const nextStep = () => {
    if (step === 'name') setStep('goal');
    else if (step === 'goal') setStep('stats');
    else if (step === 'stats') calculateAndFinish();
  };

  const prevStep = () => {
    if (step === 'goal') setStep('name');
    else if (step === 'stats') setStep('goal');
  };

  const calculateAndFinish = () => {
    setStep('calculating');
    
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    
    // Simple calculations for MVP
    const waterTarget = Math.round(weight * 35);
    const mealsTarget = formData.goal === 'muscle_gain' ? 5 : 4;
    const sleepTarget = 8;
    
    const profile: UserProfile = {
      name: formData.name,
      profile: {
        weight_kg: weight,
        height_cm: height,
        gender: formData.gender,
        main_goal: formData.goal,
      },
      targets: {
        water_ml_per_day: waterTarget,
        meals_per_day: mealsTarget,
        sleep_hours_per_night: sleepTarget,
        weekly_workouts: { cardio: 2, strength: 3 },
      },
    };

    setTimeout(() => {
      setProfile(profile);
      router.push('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center">
      <AnimatePresence mode="wait">
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm"
          >
            <h2 className="text-3xl font-bold mb-8 text-slate-900 leading-tight">Como podemos te chamar?</h2>
            <div className="space-y-6">
              <Input
                placeholder="Seu nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-14 text-lg border-slate-200 focus:border-slate-900 focus:ring-slate-900 rounded-2xl px-6"
              />
              <Button 
                onClick={nextStep} 
                disabled={!formData.name}
                className="w-full h-14 text-lg font-semibold bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-lg transition-all"
              >
                Continuar <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'goal' && (
          <motion.div
            key="goal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm"
          >
            <h2 className="text-3xl font-bold mb-8 text-slate-900 leading-tight">Qual seu principal objetivo?</h2>
            <div className="grid gap-4">
              {[
                { id: 'fat_loss', label: 'Emagrecer', desc: 'Foco em queima de gordura' },
                { id: 'muscle_gain', label: 'Ganhar Massa', desc: 'Hipertrofia e força' },
                { id: 'health', label: 'Saúde', desc: 'Longevidade e bem-estar' },
              ].map((goal) => (
                <Card 
                  key={goal.id}
                  className={`cursor-pointer border-2 transition-all rounded-2xl overflow-hidden ${
                    formData.goal === goal.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                  }`}
                  onClick={() => setFormData({ ...formData, goal: goal.id as any })}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xl">{goal.label}</p>
                      <p className={`text-sm ${formData.goal === goal.id ? 'text-slate-300' : 'text-slate-500'}`}>{goal.desc}</p>
                    </div>
                    {formData.goal === goal.id && <Check className="h-6 w-6" />}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex gap-4">
              <Button variant="ghost" onClick={prevStep} className="h-14 w-14 rounded-2xl border border-slate-200">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                onClick={nextStep}
                className="flex-1 h-14 text-lg font-semibold bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-lg transition-all"
              >
                Próximo passo
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm"
          >
            <h2 className="text-3xl font-bold mb-8 text-slate-900 leading-tight">Seus dados físicos</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-500 ml-2">Peso (kg)</label>
                <Input
                  type="number"
                  placeholder="Ex: 75"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="h-14 text-lg border-slate-200 focus:border-slate-900 rounded-2xl px-6"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-500 ml-2">Altura (cm)</label>
                <Input
                  type="number"
                  placeholder="Ex: 175"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="h-14 text-lg border-slate-200 focus:border-slate-900 rounded-2xl px-6"
                />
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" onClick={prevStep} className="h-14 w-14 rounded-2xl border border-slate-200">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={nextStep}
                  disabled={!formData.weight || !formData.height}
                  className="flex-1 h-14 text-lg font-semibold bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-lg transition-all"
                >
                  Calcular minhas metas
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'calculating' && (
          <motion.div
            key="calculating"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center space-y-8"
          >
            <div className="relative w-24 h-24 mx-auto">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-full h-full border-4 border-slate-200 border-t-slate-900 rounded-full"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Preparando seu plano...</h2>
              <p className="text-slate-500">Estamos calculando suas metas personalizadas com base no seu perfil.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
