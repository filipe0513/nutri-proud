"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/store";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { Bell, BellOff, BellRing } from "lucide-react";

interface NotificationsPreferencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPreferencesSheet({
  open,
  onOpenChange,
}: NotificationsPreferencesSheetProps) {
  const { user_profile, updateProfile } = useAppStore();
  const pathname = usePathname();
  
  // No god-mode (se o nutri estiver na home do paciente, ele vê preferencias de paciente)
  const isNutriContext = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
  const isNutri = isNutriContext && (user_profile?.role === "ADMIN" || user_profile?.role === "NUTRITIONIST");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prefs, setPrefs] = useState<Record<string, any>>({});
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (open && user_profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefs(user_profile.notification_preferences || {});
    }
    if (open && typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(window.Notification.permission);
    }
  }, [open, user_profile]);

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignal = (window as any).OneSignal;
      if (OneSignal?.Notifications?.requestPermission) {
        await OneSignal.Notifications.requestPermission();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const playerId: string | undefined = OneSignal?.User?.PushSubscription?.id;
        if (playerId) {
          await fetch('/api/users/me/push-token', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ onesignal_id: playerId }),
          });
        }
      } else {
        await Notification.requestPermission();
      }
      setPushPermission(window.Notification.permission);
      if (window.Notification.permission === 'granted') {
        toast.success('Notificações push ativadas!', {
          className: 'bg-notify-success-glass backdrop-blur-md border border-notify-success text-notify-success',
        });
      }
    } catch (error) {
      console.error('[NotificationsPreferencesSheet] Erro ao solicitar permissão push:', error);
    } finally {
      setPushLoading(false);
    }
  };

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
        { id: "EVOLUTION", label: "Check-ins de Evolução", desc: "Avisos quando o paciente responde formulários" },
        { id: "RISK_ALERTS", label: "Alertas de Risco", desc: "Sinaliza pacientes ociosos ou com queda de engajamento" },
        { id: "SYSTEM", label: "Sistema", desc: "Novos pacientes, convites e atualizações" },
      ]
    : [
        { id: "REMINDERS", label: "Lembretes e Avisos", desc: "Rotina de água, refeições, sono, etc" },
        { id: "MILESTONES", label: "Conquistas", desc: "Celebração de metas diárias e ofensivas" },
        { id: "NUTRI_ALERTS", label: "Mensagens da Nutri", desc: "Insights e orientações do seu nutricionista" },
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
          {/* Push permission status */}
          {pushPermission !== null && (
            <div className="mb-6 p-4 rounded-2xl border border-white/40 bg-white/40 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                {pushPermission === 'granted' ? (
                  <BellRing className="h-4 w-4 text-notify-success" />
                ) : pushPermission === 'denied' ? (
                  <BellOff className="h-4 w-4 text-notify-error" />
                ) : (
                  <Bell className="h-4 w-4 text-neutral-400" />
                )}
                <h4 className="text-body-1 font-bold text-neutral-600">Push no Celular</h4>
              </div>

              {pushPermission === 'granted' && (
                <p className="text-caption-1 text-notify-success">
                  Notificações push ativas.
                </p>
              )}

              {pushPermission === 'denied' && (
                <p className="text-caption-1 text-notify-error">
                  Notificações bloqueadas pelo navegador. Para ativar, vá em Configurações do navegador e permita notificações para este site.
                </p>
              )}

              {pushPermission === 'default' && (
                <>
                  <p className="text-caption-1 text-neutral-400">
                    Ative para receber lembretes e mensagens da sua nutri.
                  </p>
                  <Button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-button-1 shadow-md mt-1"
                  >
                    {pushLoading ? 'Aguardando...' : 'Ativar notificações'}
                  </Button>
                </>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {categories.map((cat) => {
              const catPrefs = prefs[cat.id] || { push: true, email: true, in_app: true };
              return (
                <div key={cat.id} className="space-y-3 bg-white/40 p-4 rounded-2xl border border-white/40">
                  <div className="flex flex-col mb-1">
                    <h4 className="text-body-1 font-bold text-neutral-600">{cat.label}</h4>
                    <p className="text-caption-2 text-neutral-400">{cat.desc}</p>
                  </div>
                  
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
