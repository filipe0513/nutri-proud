"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/store";
import { toast } from "sonner";

interface NotificationsPreferencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPreferencesSheet({
  open,
  onOpenChange,
}: NotificationsPreferencesSheetProps) {
  const { user_profile, updateProfile } = useAppStore();
  const isNutri = user_profile?.role === "ADMIN" || user_profile?.role === "NUTRI";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prefs, setPrefs] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open && user_profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefs(user_profile.notification_preferences || {});
    }
  }, [open, user_profile]);

  const handleToggle = (category: string, channel: string, value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || { push: true, email: true, in_app: true }),
        [channel]: value,
      },
    }));
  };

  const categories = isNutri 
    ? [
        { id: "EVOLUTION", label: "Check-ins de Evolução" },
        { id: "RISK_ALERTS", label: "Alertas de Risco" },
        { id: "SYSTEM", label: "Sistema" },
      ]
    : [
        { id: "REMINDERS", label: "Lembretes" },
        { id: "MILESTONES", label: "Conquistas" },
        { id: "NUTRI_ALERTS", label: "Avisos da Nutri" },
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user_profile) return;

    try {
      const mergedProfile = {
        ...user_profile,
        notification_preferences: prefs,
      };

      await updateProfile(mergedProfile);
      onOpenChange(false);
      toast.success("Salvo com sucesso!", {
        className:
          "bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success",
      });
      fetch("/api/events", { method: "POST", body: JSON.stringify({ eventName: "SETTINGS_SAVED" }) }).catch(() => {});
    } catch (error) {
      console.error("Error saving preferences", error);
      toast.error("Erro ao salvar configurações.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-glass-light-3 backdrop-blur-lg border-l border-white/40 sm:max-w-md w-[85vw] p-0 flex flex-col"
      >
        <SheetHeader className="p-6 border-b border-white/20 flex-shrink-0 text-left">
          <SheetTitle className="text-title-2 text-neutral-500">Notificações</SheetTitle>
          <SheetDescription className="text-body-2 text-neutral-400">
            Escolha o que você quer receber e onde
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {categories.map((cat) => {
              const catPrefs = prefs[cat.id] || { push: true, email: true, in_app: true };
              return (
                <div key={cat.id} className="space-y-3 bg-white/40 p-4 rounded-2xl border border-white/40">
                  <h4 className="text-body-1 font-bold text-neutral-600">{cat.label}</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-body-2 text-neutral-500">No Aplicativo (Sino)</span>
                    <Switch 
                      checked={catPrefs.in_app} 
                      onCheckedChange={(v) => handleToggle(cat.id, "in_app", v)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-body-2 text-neutral-500">Notificação no Celular (Push)</span>
                    <Switch 
                      checked={catPrefs.push} 
                      onCheckedChange={(v) => handleToggle(cat.id, "push", v)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-body-2 text-neutral-500">E-mail</span>
                    <Switch 
                      checked={catPrefs.email} 
                      onCheckedChange={(v) => handleToggle(cat.id, "email", v)} 
                    />
                  </div>
                </div>
              );
            })}
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-button-1 shadow-lg mt-4"
            >
              Salvar
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
