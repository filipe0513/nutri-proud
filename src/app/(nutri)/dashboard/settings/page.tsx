"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/store";
import { profileSettingsSchema, ProfileSettingsForm } from "@/schemas/profileSchema";
import { toast } from "sonner";
import { LogOut, ArrowLeft, Pencil } from "lucide-react";
import { signOut } from "next-auth/react";
import packageInfo from "../../../../../package.json";
import { AvatarUploadButton } from "@/components/shared/AvatarUploadButton";
import { CurrentPlanCard } from "@/components/shared/CurrentPlanCard";
import { ReleaseNotesDrawer } from "@/components/shared/ReleaseNotesDrawer";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import Link from "next/link";

type DrawerSection = "personal" | null;

export default function NutriSettingsPage() {
  const { user_profile, updateProfile } = useAppStore();
  const [activeDrawer, setActiveDrawer] = useState<DrawerSection>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  const name = user_profile?.name || "—";

  const saveSection = useCallback(
    async (data: Partial<ProfileSettingsForm>) => {
      if (!user_profile) return;

      const mergedProfile = {
        ...user_profile,
        name: data.name ?? user_profile.name,
      };

      await updateProfile(mergedProfile);
      setActiveDrawer(null);
      toast.success("Salvo com sucesso!", {
        className:
          "bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success",
      });
      fetch('/api/events', { method: 'POST', body: JSON.stringify({ eventName: 'SETTINGS_SAVED' }) }).catch(() => {});
    },
    [user_profile, updateProfile],
  );

  return (
    <div className="pb-32 pt-8 px-6 max-w-lg mx-auto space-y-6">
      {/* Header Customizado com Voltar */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/dashboard"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-neutral-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-title-2 font-bold text-neutral-600">Configurações</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Profile Header Card */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 flex items-center space-x-4">
          <AvatarUploadButton size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-title-3 font-bold text-neutral-600 truncate">{name}</p>
            {user_profile?.email && (
              <p className="text-caption-1 text-neutral-500 truncate">{user_profile.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="h-4" />
      <CurrentPlanCard />

      {/* ── Block 1: Dados Pessoais ── */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-title-3 font-bold text-neutral-600">Dados Pessoais</h2>
            <button
              type="button"
              aria-label="Editar Dados Pessoais"
              onClick={() => setActiveDrawer("personal")}
              className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-neutral-500 hover:text-brand-500 hover:bg-slate-100 transition-all"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="py-1">
            <p className="text-caption-1 text-neutral-500">Nome</p>
            <p className="text-body-1 font-medium text-neutral-600">{name}</p>
          </div>
        </CardContent>
      </Card>

      <div className="h-4" />

      {/* Logout & Version */}
      <div className="space-y-4 pt-4">
        <button
          onClick={async () => {
            await fetch('/api/sessions', { method: 'DELETE' });
            signOut({ callbackUrl: '/welcome' });
          }}
          className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 py-4 rounded-3xl transition-colors font-bold text-button-1 border border-red-100 bg-white shadow-sm"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair da Conta</span>
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

      <ReleaseNotesDrawer 
        open={showReleaseNotes} 
        onOpenChange={setShowReleaseNotes} 
        currentVersion={packageInfo.version} 
      />
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
      <DrawerContent className="!bg-white backdrop-blur-2xl border-t border-slate-200 shadow-[0_-15px_60px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] px-6 pb-12">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-title-2 text-neutral-600">Dados Pessoais</DrawerTitle>
          <DrawerDescription className="text-body-2 text-neutral-500">Altere seu nome e foto de perfil</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit((data) => onSave(data))} className="space-y-4 mt-2">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <AvatarUploadButton size="lg" />
            <p className="text-caption-2 text-neutral-400">Toque no avatar para alterar a foto</p>
          </div>
          <div className="space-y-2">
            <label className="text-caption-1 font-medium text-neutral-600">
              Como quer ser chamado(a)?
            </label>
            <input
              {...register("name")}
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-input-1 text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.name && (
              <p className="text-caption-2 text-notify-error">{errors.name.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-button-1 shadow-lg"
          >
            Salvar
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
