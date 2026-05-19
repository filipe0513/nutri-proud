"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAppStore } from "@/store/store";
import { Flame } from "lucide-react";
import { NotificationsSheet } from "./NotificationsSheet";

export function StoryHeader() {
  const { user_profile } = useAppStore();
  const [streakCount, setStreakCount] = useState(0);

  // Fetch streak data for the header badge
  useEffect(() => {
    const match = document.cookie.match(/anon_user_id=([^;]+)/);
    const userId = match ? decodeURIComponent(match[1]) : null;
    if (!userId) return;

    fetch(`/api/streaks?userId=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const best = Math.max(
          data.workout?.streak || 0,
          data.bestDaily?.streak || 0,
        );
        setStreakCount(best);
      })
      .catch(() => {
        /* silently ignore */
      });
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-glass-light-2 backdrop-blur-md border border-white/60 shadow-sm">
          <Image
            src="/logo-color-h.webp"
            alt="Orgulho da Nutri"
            width={1332}
            height={281}
            priority
            unoptimized
            className="h-7 w-auto"
          />
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-title-1 text-neutral-500">
            Olá, {user_profile?.name || "Explorador"}
          </h1>
          <p className="text-body-1 text-neutral-400 mt-0.5">
            Como está seu dia hoje?
          </p>
        </div>

        {streakCount > 0 && (
          <div className="flex items-center space-x-1.5 bg-brand-500 text-white rounded-full px-3.5 py-1.5 shadow-sm mt-1">
            <Flame className="h-4 w-4" />
            <span className="text-body-2 font-bold">{streakCount}</span>
            <span className="text-caption-1 font-medium">dias</span>
          </div>
        )}
      </div>
      <div className="absolute top-4 right-4">
        <NotificationsSheet />
      </div>
    </div>
  );
}
