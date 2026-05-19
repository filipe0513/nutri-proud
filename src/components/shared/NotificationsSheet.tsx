"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell } from "lucide-react";
import { useAppStore } from "@/store/store";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  actionType?: string | null;
  createdAt: string;
}

export function NotificationsSheet() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { setActiveDrawer } = useAppStore();

  const fetchNotifications = async () => {
    // Pegando ID logado
    const match = document.cookie.match(/anon_user_id=([^;]+)/);
    const userId = match ? decodeURIComponent(match[1]) : null;
    if (!userId) return;

    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
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
  }, [open]); // Refresh when opened

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      const match = document.cookie.match(/anon_user_id=([^;]+)/);
      const userId = match ? decodeURIComponent(match[1]) : null;
      if (userId) {
        await fetch(`/api/notifications`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id, userId }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      }
    }

    if (notif.actionType === "OPEN_WATER_DRAWER") {
      setOpen(false);
      setActiveDrawer("water");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-neutral-200 transition">
          <Bell className="w-6 h-6 text-neutral-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-glass-light-3 backdrop-blur-lg border-l border-white/40 sm:max-w-md w-[85vw] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-white/20">
          <SheetTitle className="text-title-2 text-neutral-500">Notificações</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-center text-body-2 text-neutral-400 mt-10">Nenhuma notificação por enquanto.</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-xl border border-white/40 cursor-pointer transition ${
                  notif.isRead ? "bg-glass-light-1 opacity-70" : "bg-white shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-body-1 font-semibold ${notif.isRead ? "text-neutral-500" : "text-brand-600"}`}>
                    {notif.title}
                  </h4>
                  {!notif.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />}
                </div>
                <p className="text-body-2 text-neutral-500">{notif.message}</p>
                <span className="text-caption-1 text-neutral-400 mt-2 block">
                  {new Date(notif.createdAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
