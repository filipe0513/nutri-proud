"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Sparkles, Droplets, Target, Settings, Utensils } from "lucide-react";
import { useAppStore } from "@/store/store";

interface NotificationsSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  customTrigger?: React.ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  category: string;
  actionType?: string | null;
  createdAt: string;
}

/** Visual config by notification category */
const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; iconColor: string; dot: string }
> = {
  INSIGHT: {
    icon: Sparkles,
    bg: "bg-violet-50",
    iconColor: "text-violet-500",
    dot: "bg-violet-500",
  },
  SYSTEM: {
    icon: Utensils,
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
    dot: "bg-orange-500",
  },
  REMINDER: {
    icon: Droplets,
    bg: "bg-sky-50",
    iconColor: "text-sky-500",
    dot: "bg-sky-500",
  },
  ACHIEVEMENT: {
    icon: Target,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  ALERT: {
    icon: Settings,
    bg: "bg-red-50",
    iconColor: "text-red-500",
    dot: "bg-red-500",
  },
};

const DEFAULT_CONFIG = CATEGORY_CONFIG.REMINDER;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsSheet({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  customTrigger,
}: NotificationsSheetProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { setActiveDrawer, setPendingInsightData } = useAppStore();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
    }
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notif: Notification) => {
    // Optimistically mark as read in UI
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      // Persist in background
      fetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id }),
      }).catch(() => {/* silent */});
    }

    // Handle action types
    if (notif.actionType === "OPEN_WATER_DRAWER") {
      setOpen(false);
      setActiveDrawer("water");
      return;
    }

    if (notif.actionType === "OPEN_INSIGHTS_DRAWER") {
      // Extrai a mensagem da notificação (remove o sufixo " (foco: PILAR)" se houver)
      const rawMessage = notif.message;
      const ctaMatch = rawMessage.match(/ \(foco: ([A-Z]+)\)$/);
      const cta = ctaMatch ? ctaMatch[1] : null;
      const message = cta ? rawMessage.slice(0, rawMessage.lastIndexOf(` (foco: ${cta})`)) : rawMessage;
      setPendingInsightData({ message, cta });
      setOpen(false);
      setActiveDrawer("insights");
      return;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {customTrigger ? customTrigger : (
          <button
            id="notifications-trigger"
            aria-label="Abrir notificações"
            className="relative p-2 rounded-full hover:bg-neutral-200 transition"
          >
            <Bell className="w-6 h-6 text-neutral-500" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-[10px] font-bold leading-none px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </span>
            )}
          </button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="bg-glass-light-3 backdrop-blur-lg border-l border-white/40 sm:max-w-md w-[85vw] p-0 flex flex-col"
      >
        <SheetHeader className="p-6 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-title-2 text-neutral-500">
              Notificações
            </SheetTitle>
            {unreadCount > 0 && (
              <span className="text-caption-1 text-neutral-400">
                {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 space-y-3 text-center px-4">
              <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-neutral-300" />
              </div>
              <p className="text-body-1 font-medium text-neutral-400">
                Nenhuma notificação ainda
              </p>
              <p className="text-body-2 text-neutral-300">
                Insights e análises da Nutri vão aparecer aqui.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const cfg = CATEGORY_CONFIG[notif.category] ?? DEFAULT_CONFIG;
              const Icon = cfg.icon;
              const isClickable = !!notif.actionType;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                    notif.isRead
                      ? "bg-glass-light-1 border-white/30 opacity-70"
                      : "bg-white border-white/60 shadow-sm"
                  } ${isClickable ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}`}
                >
                  {/* Icon */}
                  <div
                    className={`h-9 w-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                  >
                    <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h4
                        className={`text-body-2 font-semibold leading-snug ${
                          notif.isRead ? "text-neutral-500" : "text-neutral-600"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`}
                        />
                      )}
                    </div>
                    <p className="text-body-2 text-neutral-500 leading-snug line-clamp-3">
                      {notif.message}
                    </p>
                    <span className="text-caption-2 text-neutral-400 mt-1.5 block">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
