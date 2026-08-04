"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useCallback } from "react";
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
import { Pencil, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import packageInfo from "../../../../package.json";
import { AvatarUploadButton } from "@/components/shared/AvatarUploadButton";
import { ReleaseNotesDrawer } from "@/components/shared/ReleaseNotesDrawer";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { TopHeader } from "@/components/shared/TopHeader";

// ── Helpers ──────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "contato@orgulhodanutri.com.br";

const GOAL_LABELS: Record<string, string> = {
  fat_loss: "Emagrecimento",
  muscle_gain: "Ganho de Massa",
  health: "Saúde Geral",
};

function getMealLabel(id: string): string {
  return ALL_MEALS.find((m) => m.id === id)?.label ?? id;
}

// ── Drawer-scoped forms ──────────────────────────────────────

type DrawerSection = "personal" | "body" | "targets" | "meals" | null;

// ── Component ────────────────────────────────────────────────

export default function SettingsPage() {
  const { user_profile, updateProfile } = useAppStore();
  const router = useRouter();
  const [activeDrawer, setActiveDrawer] = useState<DrawerSection>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  // ── Derive read-only display values ──
  const name = user_profile?.name || "—";
  const weightKg = user_profile?.profile?.weight_kg ?? "—";
  const heightCm = user_profile?.profile?.height_cm ?? "—";
  const goal = GOAL_LABELS[user_profile?.profile?.main_goal || ""] || "—";
  const waterTargetMl = user_profile?.targets?.water_ml_per_day ?? "—";
  const sleepTargetHours = user_profile?.targets?.sleep_hours_per_night ?? "—";
  const weeklyWorkouts = user_profile?.targets?.weekly_workouts ?? "—";
  const rawTargets = user_profile?.targets as Record<string, unknown> | undefined;
  const plannedMeals: string[] =
    Array.isArray(rawTargets?.planned_meals) && (rawTargets.planned_meals as string[]).length > 0
      ? (rawTargets.planned_meals as string[])
      : [];

  // ── Save handler shared by all drawers ──
  const saveSection = useCallback(
    async (data: Partial<ProfileSettingsForm>) => {
      if (!user_profile) return;

      const mergedProfile = {
        ...user_profile,
        name: data.name ?? user_profile.name,
        profile: {
          ...(user_profile.profile || {}),
          weight_kg: data.weight_kg ?? user_profile.profile?.weight_kg,
          height_cm: data.height_cm ?? user_profile.profile?.height_cm,
          main_goal: data.goal ?? user_profile.profile?.main_goal,
        },
        targets: {
          ...(user_profile.targets || {}),
          water_ml_per_day: data.water_target_ml ?? user_profile.targets?.water_ml_per_day,
          sleep_hours_per_night: data.sleep_target_hours ?? user_profile.targets?.sleep_hours_per_night,
          weekly_workouts: data.weekly_workouts ?? user_profile.targets?.weekly_workouts,
          planned_meals: data.planned_meals ?? (rawTargets?.planned_meals as string[]) ?? [],
        },
      };

      await updateProfile(mergedProfile);
      setActiveDrawer(null);
      toast.success("Salvo com sucesso!", {
        className:
          "bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success",
      });
      fetch('/api/events', { method: 'POST', body: JSON.stringify({ eventName: 'SETTINGS_SAVED' }) }).catch(() => {});
    },
    [user_profile, updateProfile, rawTargets],
  );

  return (
    <div className="pb-32 pt-24 px-6 max-w-lg mx-auto space-y-6">
      <TopHeader leftAction="back" title="Configurações" rightAction="none" />

      {/* Profile Header Card */}
      <Card className="bg-glass-light-2 backdrop-blur-md border-white/40 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 flex items-center space-x-4">
          <AvatarUploadButton size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-title-3 font-bold text-neutral-500 truncate">{name}</p>
            {user_profile?.email && (
              <p className="text-caption-1 text-neutral-400 truncate">{user_profile.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Anonymous Warning */}
      {user_profile?.is_anonymous && (
        <Card className="bg-orange-50 border-orange-200 shadow-sm rounded-3xl overflow-hidden">
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

      {/* ── Block 1: Dados Pessoais ── */}
      <SemanticBlock
        title="Dados Pessoais"
        onEdit={() => setActiveDrawer("personal")}
      >
        <ReadRow label="Nome" value={name} />
      </SemanticBlock>

      {/* ── Block 2: Corpo & Objetivo ── */}
      <SemanticBlock
        title="Corpo & Objetivo"
        onEdit={() => setActiveDrawer("body")}
      >
        <div className="grid grid-cols-2 gap-3">
          <ReadRow label="Peso" value={`${weightKg} kg`} />
          <ReadRow label="Altura" value={`${heightCm} cm`} />
        </div>
        <ReadRow label="Objetivo" value={goal} />
      </SemanticBlock>

      {/* ── Block 3: Metas ── */}
      <SemanticBlock
        title="Ajuste Fino das Metas"
        onEdit={() => setActiveDrawer("targets")}
      >
        <ReadRow label="Água diária" value={`${waterTargetMl} ml`} />
        <ReadRow label="Sono" value={`${sleepTargetHours} horas`} />
        <ReadRow label="Treinos/semana" value={`${weeklyWorkouts} dias`} />
      </SemanticBlock>

      {/* ── Block 4: Minhas Refeições ── */}
      <SemanticBlock
        title="Minhas Refeições"
        onEdit={() => setActiveDrawer("meals")}
      >
        {plannedMeals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {plannedMeals.map((id) => (
              <span
                key={id}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-brand-100 text-brand-600 text-caption-1 font-medium"
              >
                {getMealLabel(id)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-caption-1 text-neutral-400">Nenhuma refeição selecionada</p>
        )}
      </SemanticBlock>

      <div className="h-4" />

      {/* ── Nutri Concierge Banner ── */}
      <Card className="bg-glass-light-1 backdrop-blur-md border border-white/40 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-4 text-center">
          <div>
            <h3 className="text-title-3 font-bold text-neutral-600">É Profissional de Saúde?</h3>
            <p className="text-body-2 text-neutral-500 mt-1">
              Solicite acesso ao painel de controle e acompanhe seus pacientes.
            </p>
          </div>
          <a
            href={`mailto:${ADMIN_EMAIL}?subject=Solicitação de Acesso Nutri - Orgulho da Nutri&body=Olá! Sou nutricionista e gostaria de testar o painel profissional.%0D%0A%0D%0AMeu e-mail de cadastro no app é: ${user_profile?.email || "[DIGITE SEU E-MAIL AQUI]"}%0D%0A%0D%0AAbraços!`}
            className="block"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-bold rounded-xl transition-colors"
            >
              Solicitar acesso como Nutri
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Logout & Version */}
      <div className="space-y-4 pt-4">
        <button
          onClick={async () => {
            await fetch('/api/sessions', { method: 'DELETE' });
            signOut({ callbackUrl: '/welcome' });
          }}
          className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50/50 py-4 rounded-3xl transition-colors font-bold text-button-1 border border-red-100 bg-white/40 backdrop-blur-sm"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair do App</span>
        </button>
        <button
          type="button"
          onClick={() => setShowReleaseNotes(true)}
          className="text-center text-caption-2 text-neutral-400 hover:text-neutral-500 hover:underline transition-colors w-full"
        >
          Versão {packageInfo.version}
        </button>
      </div>

      {/* ── Drawer: Dados Pessoais ── */}
      <PersonalDrawer
        open={activeDrawer === "personal"}
        onOpenChange={(o) => !o && setActiveDrawer(null)}
        onSave={saveSection}
      />

      {/* ── Drawer: Corpo & Objetivo ── */}
      <BodyDrawer
        open={activeDrawer === "body"}
        onOpenChange={(o) => !o && setActiveDrawer(null)}
        onSave={saveSection}
      />

      {/* ── Drawer: Metas ── */}
      <TargetsDrawer
        open={activeDrawer === "targets"}
        onOpenChange={(o) => !o && setActiveDrawer(null)}
        onSave={saveSection}
      />

      {/* ── Drawer: Refeições ── */}
      <MealsDrawer
        open={activeDrawer === "meals"}
        onOpenChange={(o) => !o && setActiveDrawer(null)}
        onSave={saveSection}
      />

      <ReleaseNotesDrawer 
        open={showReleaseNotes} 
        onOpenChange={setShowReleaseNotes} 
        currentVersion={packageInfo.version} 
      />
    </div>
  );
}

// ── Reusable Semantic Block ──────────────────────────────────

function SemanticBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-glass-light-2 backdrop-blur-md border-white/40 shadow-sm rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 font-bold text-neutral-500">{title}</h2>
          <button
            type="button"
            aria-label={`Editar ${title}`}
            onClick={onEdit}
            className="h-8 w-8 rounded-full bg-glass-light-1 border border-white/40 flex items-center justify-center text-neutral-400 hover:text-brand-500 hover:bg-glass-light-3 transition-all"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ── Reusable Read-only Row ───────────────────────────────────

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <p className="text-caption-1 text-neutral-400">{label}</p>
      <p className="text-body-1 font-medium text-neutral-500">{value}</p>
    </div>
  );
}

// ── Drawer: Dados Pessoais ───────────────────────────────────

function PersonalDrawer({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<ProfileSettingsForm>) => Promise<void>;
}) {
  const userProfile = useAppStore((state) => state.user_profile);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Pick<ProfileSettingsForm, "name">>({
    resolver: zodResolver(profileSettingsSchema.pick({ name: true })),
  });

  useEffect(() => {
    if (open && userProfile) {
      reset({ name: userProfile.name });
    }
  }, [open, userProfile, reset]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-2 text-neutral-500">Dados Pessoais</DrawerTitle>
          <DrawerDescription className="text-body-2 text-neutral-400">Altere seu nome e foto de perfil</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit((data) => onSave(data))} className="space-y-4 mt-2">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <AvatarUploadButton size="lg" />
            <p className="text-caption-2 text-neutral-400">Toque no avatar para alterar a foto</p>
          </div>
          <div className="space-y-2">
            <label className="text-caption-1 font-medium text-neutral-500/80">
              Como quer ser chamado?
            </label>
            <input
              {...register("name")}
              className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.name && (
              <p className="text-caption-2 text-notify-error">{errors.name.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-button-1 shadow-lg"
          >
            Salvar
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

// ── Drawer: Corpo & Objetivo ─────────────────────────────────

function BodyDrawer({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<ProfileSettingsForm>) => Promise<void>;
}) {
  const userProfile = useAppStore((state) => state.user_profile);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Pick<ProfileSettingsForm, "weight_kg" | "height_cm" | "goal">>({
    resolver: zodResolver(
      profileSettingsSchema.pick({ weight_kg: true, height_cm: true, goal: true }),
    ),
  });

  useEffect(() => {
    if (open && userProfile) {
      reset({
        weight_kg: userProfile.profile?.weight_kg || 70,
        height_cm: userProfile.profile?.height_cm || 170,
        goal: userProfile.profile?.main_goal || "health",
      });
    }
  }, [open, userProfile, reset]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-2 text-neutral-500">Corpo & Objetivo</DrawerTitle>
          <DrawerDescription className="text-body-2 text-neutral-400">Ajuste seus dados corporais e objetivo</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit((data) => onSave(data))} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-caption-1 font-medium text-neutral-500/80">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                {...register("weight_kg", { valueAsNumber: true })}
                className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.weight_kg && (
                <p className="text-caption-2 text-notify-error">{errors.weight_kg.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-caption-1 font-medium text-neutral-500/80">Altura (cm)</label>
              <input
                type="number"
                {...register("height_cm", { valueAsNumber: true })}
                className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.height_cm && (
                <p className="text-caption-2 text-notify-error">{errors.height_cm.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-caption-1 font-medium text-neutral-500/80">Seu Objetivo</label>
            <select
              {...register("goal")}
              className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="fat_loss">Emagrecimento</option>
              <option value="muscle_gain">Ganho de Massa</option>
              <option value="health">Saúde Geral</option>
            </select>
            {errors.goal && (
              <p className="text-caption-2 text-notify-error">{errors.goal.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-button-1 shadow-lg"
          >
            Salvar
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

// ── Drawer: Metas ────────────────────────────────────────────

function TargetsDrawer({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<ProfileSettingsForm>) => Promise<void>;
}) {
  const userProfile = useAppStore((state) => state.user_profile);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Pick<ProfileSettingsForm, "water_target_ml" | "sleep_target_hours" | "weekly_workouts">>({
    resolver: zodResolver(
      profileSettingsSchema.pick({
        water_target_ml: true,
        sleep_target_hours: true,
        weekly_workouts: true,
      }),
    ),
  });

  useEffect(() => {
    if (open && userProfile) {
      reset({
        water_target_ml: userProfile.targets?.water_ml_per_day || 2000,
        sleep_target_hours: userProfile.targets?.sleep_hours_per_night || 8,
        weekly_workouts: userProfile.targets?.weekly_workouts ?? 3,
      });
    }
  }, [open, userProfile, reset]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-2 text-neutral-500">Ajuste Fino das Metas</DrawerTitle>
          <DrawerDescription className="text-body-2 text-neutral-400">Personalize suas metas diárias</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit((data) => onSave(data))} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-caption-1 font-medium text-neutral-500/80">Meta de Água Diária (ml)</label>
            <input
              type="number"
              {...register("water_target_ml", { valueAsNumber: true })}
              className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-caption-2 text-neutral-400">
              O app calcula isso automaticamente, mas você pode ajustar se sua Nutri pedir.
            </p>
            {errors.water_target_ml && (
              <p className="text-caption-2 text-notify-error">{errors.water_target_ml.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-caption-1 font-medium text-neutral-500/80">Meta de Sono (horas)</label>
            <input
              type="number"
              step="0.5"
              {...register("sleep_target_hours", { valueAsNumber: true })}
              className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.sleep_target_hours && (
              <p className="text-caption-2 text-notify-error">{errors.sleep_target_hours.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-caption-1 font-medium text-neutral-500/80">Dias de treino por semana (3–7)</label>
            <input
              type="number"
              min="3"
              max="7"
              {...register("weekly_workouts", { valueAsNumber: true })}
              className="w-full h-14 bg-white/50 border border-white/40 rounded-2xl px-4 text-input-1 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.weekly_workouts && (
              <p className="text-caption-2 text-notify-error">{errors.weekly_workouts.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-button-1 shadow-lg"
          >
            Salvar
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

// ── Drawer: Refeições ────────────────────────────────────────

function MealsDrawer({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<ProfileSettingsForm>) => Promise<void>;
}) {
  const userProfile = useAppStore((state) => state.user_profile);
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<Pick<ProfileSettingsForm, "planned_meals">>({
    resolver: zodResolver(profileSettingsSchema.pick({ planned_meals: true })),
  });

  useEffect(() => {
    if (open && userProfile) {
      const rawTargets = userProfile.targets as Record<string, unknown> | undefined;
      const plannedMeals: string[] =
        Array.isArray(rawTargets?.planned_meals) && (rawTargets.planned_meals as string[]).length > 0
          ? (rawTargets.planned_meals as string[])
          : ["breakfast", "lunch", "afternoon_snack", "dinner"];
      reset({ planned_meals: plannedMeals });
    }
  }, [open, userProfile, reset]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12 max-h-[85vh] overflow-y-auto">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-2 text-neutral-500">Minhas Refeições</DrawerTitle>
          <DrawerDescription className="text-body-2 text-neutral-400">Quais refeições fazem parte da sua rotina diária?</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit((data) => onSave(data))} className="space-y-4 mt-2">
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
                          ? "bg-orange-50 border-orange-300"
                          : "bg-white/40 border-white/40 hover:bg-white/60"
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
                      <span
                        className={`text-caption-1 font-medium leading-tight ${
                          checked ? "text-orange-800" : "text-neutral-500"
                        }`}
                      >
                        {meal.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.planned_meals && (
            <p className="text-caption-2 text-notify-error">{errors.planned_meals.message}</p>
          )}
          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-button-1 shadow-lg"
          >
            Salvar
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
