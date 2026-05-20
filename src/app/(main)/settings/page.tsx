"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/store";
import {
  profileSettingsSchema,
  ProfileSettingsForm,
  ALL_MEALS,
} from "@/schemas/profileSchema";
import { toast } from "sonner";
import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import packageInfo from "../../../../package.json";

export default function SettingsPage() {
  const { user_profile, updateProfile } = useAppStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileSettingsForm>({
    resolver: zodResolver(profileSettingsSchema),
  });

  useEffect(() => {
    if (user_profile) {
      const rawTargets = user_profile.targets as Record<string, unknown>;
      // Support legacy profiles that still have meals_per_day (number) stored
      const plannedMeals: string[] =
        Array.isArray(rawTargets?.planned_meals) && rawTargets.planned_meals.length > 0
          ? (rawTargets.planned_meals as string[])
          : ['breakfast', 'lunch', 'afternoon_snack', 'dinner'];

      reset({
        name: user_profile.name,
        weight_kg: user_profile.profile?.weight_kg || 70,
        height_cm: user_profile.profile?.height_cm || 170,
        goal: user_profile.profile?.main_goal || 'health',
        water_target_ml: user_profile.targets?.water_ml_per_day || 2000,
        sleep_target_hours: user_profile.targets?.sleep_hours_per_night || 8,
        weekly_workouts: user_profile.targets?.weekly_workouts ?? 3,
        planned_meals: plannedMeals,
      });
    }
  }, [user_profile, reset]);

  const onSubmit = async (data: ProfileSettingsForm) => {
    if (!user_profile) return;

    await updateProfile({
      ...user_profile,
      name: data.name,
      profile: {
        ...(user_profile.profile || {}),
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        main_goal: data.goal,
      },
      targets: {
        ...(user_profile.targets || {}),
        water_ml_per_day: data.water_target_ml,
        sleep_hours_per_night: data.sleep_target_hours,
        weekly_workouts: data.weekly_workouts,
        planned_meals: data.planned_meals,
      },
    });

    toast.success("Perfil atualizado com sucesso!", {
      className:
        "bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success",
    });
  };

  const appVersion = packageInfo.version;
  const environment = process.env.NODE_ENV;

  return (
    <div className="pb-40 pt-8 px-6 max-w-lg mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <Link
          href="/"
          className="h-10 w-10 bg-glass-light-2 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-neutral-500 hover:scale-105 transition-transform"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-title-1 font-bold text-neutral-500">
          Configurações
        </h1>
      </div>

      {user_profile?.is_anonymous && (
        <Card className="bg-orange-50 border-orange-200 shadow-sm rounded-3xl overflow-hidden mb-6">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-title-3 font-bold text-orange-800">
              Modo Visitante
            </h2>
            <p className="text-body-2 text-orange-700">
              Seus dados não estão salvos na nuvem. Crie uma conta gratuita para
              não perdê-los.
            </p>
            <Button
              onClick={() => router.push("/welcome?forceLogin=true")}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
            >
              Criar conta grátis
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção 1: Dados Pessoais */}
        <Card className="bg-glass-light-2 backdrop-blur-md border-white/40 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-title-3 font-bold text-neutral-500">
              Dados Pessoais
            </h2>

            <div className="space-y-2">
              <label className="text-caption-1 font-medium text-neutral-500/80">
                Como quer ser chamado?
              </label>
              <input
                {...register("name")}
                className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.name && (
                <p className="text-caption-2 text-notify-error">
                  {errors.name.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Corpo & Objetivo */}
        <Card className="bg-glass-light-2 backdrop-blur-md border-white/40 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-title-3 font-bold text-neutral-500">
              Corpo &amp; Objetivo
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-caption-1 font-medium text-neutral-500/80">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register("weight_kg", { valueAsNumber: true })}
                  className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {errors.weight_kg && (
                  <p className="text-caption-2 text-notify-error">
                    {errors.weight_kg.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-caption-1 font-medium text-neutral-500/80">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  {...register("height_cm", { valueAsNumber: true })}
                  className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {errors.height_cm && (
                  <p className="text-caption-2 text-notify-error">
                    {errors.height_cm.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-caption-1 font-medium text-neutral-500/80">
                Seu Objetivo
              </label>
              <select
                {...register("goal")}
                className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="fat_loss">Emagrecimento</option>
                <option value="muscle_gain">Ganho de Massa</option>
                <option value="health">Saúde Geral</option>
              </select>
              {errors.goal && (
                <p className="text-caption-2 text-notify-error">
                  {errors.goal.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Ajuste Fino das Metas */}
        <Card className="bg-glass-light-2 backdrop-blur-md border-white/40 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-title-3 font-bold text-neutral-500">
              Ajuste Fino das Metas
            </h2>

            <div className="space-y-2">
              <label className="text-caption-1 font-medium text-neutral-500/80">
                Meta de Água Diária (ml)
              </label>
              <input
                type="number"
                {...register("water_target_ml", { valueAsNumber: true })}
                className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-caption-2 text-neutral-400">
                O app calcula isso automaticamente, mas você pode ajustar se sua
                Nutri pedir.
              </p>
              {errors.water_target_ml && (
                <p className="text-caption-2 text-notify-error">
                  {errors.water_target_ml.message}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-caption-1 font-medium text-neutral-500/80">
                Meta de Sono (horas)
              </label>
              <input
                type="number"
                step="0.5"
                {...register("sleep_target_hours", { valueAsNumber: true })}
                className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.sleep_target_hours && (
                <p className="text-caption-2 text-notify-error">
                  {errors.sleep_target_hours.message}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-caption-1 font-medium text-neutral-500/80">
                Dias de treino por semana (3–7)
              </label>
              <input
                type="number"
                min="3"
                max="7"
                {...register("weekly_workouts", { valueAsNumber: true })}
                className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.weekly_workouts && (
                <p className="text-caption-2 text-notify-error">
                  {errors.weekly_workouts.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 4: Minhas Refeições */}
        <Card className="bg-glass-light-2 backdrop-blur-md border-white/40 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-title-3 font-bold text-neutral-500">
                Minhas Refeições
              </h2>
              <p className="text-caption-1 text-neutral-400 mt-1">
                Quais refeições fazem parte da sua rotina diária?
              </p>
            </div>

            <Controller
              name="planned_meals"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {ALL_MEALS.map((meal) => {
                    const checked = field.value.includes(meal.id);
                    return (
                      <label
                        key={meal.id}
                        htmlFor={`meal-${meal.id}`}
                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          checked
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-white/40 border-white/40 hover:bg-white/60'
                        }`}
                      >
                        <Checkbox
                          id={`meal-${meal.id}`}
                          checked={checked}
                          onCheckedChange={(checkedState) => {
                            const current = field.value;
                            if (checkedState) {
                              field.onChange([...current, meal.id]);
                            } else {
                              field.onChange(current.filter((m: string) => m !== meal.id));
                            }
                          }}
                          className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <span className={`text-caption-1 font-medium leading-tight ${checked ? 'text-orange-800' : 'text-neutral-500'}`}>
                          {meal.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.planned_meals && (
              <p className="text-caption-2 text-notify-error">
                {errors.planned_meals.message}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 pb-6 pt-4 px-6 max-w-lg mx-auto bg-glass-light-3 backdrop-blur-lg border-t border-white/40 z-40">
          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-button-1 shadow-lg"
          >
            Salvar Alterações
          </Button>
        </div>
      </form>

      <div className="pt-4 border-t border-white/20 mt-8 mb-4">
        <Button
          variant="ghost"
          onClick={async () => {
            useAppStore.getState().resetData();
            await signOut({ callbackUrl: "/welcome" });
          }}
          className="w-full h-14 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold text-button-1 flex items-center justify-center space-x-2 border border-red-500/20 backdrop-blur-md"
        >
          <LogOut size={20} />
          <span>Sair da Conta</span>
        </Button>
      </div>

      <div className="mt-8 text-center pb-8">
        <p className="text-caption-1 text-neutral-400">
          Orgulho da Nutri • Versão {appVersion}
          <span className="text-neutral-300 ml-1 text-xs">({environment})</span>
        </p>
      </div>
    </div>
  );
}
