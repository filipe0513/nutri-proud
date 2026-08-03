"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/store";
import { Flame } from "lucide-react";
import { ReleaseNotesDrawer } from "./ReleaseNotesDrawer";
import packageInfo from "../../../package.json";

export function StoryHeader() {
  const { user_profile } = useAppStore();
  const [streakCount, setStreakCount] = useState(0);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  const appVersion = packageInfo.version;

  // Fetch streak data for the header badge
  useEffect(() => {
    const match = document.cookie.match(/anon_user_id=([^;]+)/);
    const userId = match ? decodeURIComponent(match[1]) : null;
    if (!userId) return;

    fetch('/api/streaks')
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
      {/* 2nd Row: Avatar, Greeting, Date & Versions */}
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

      {/* Release Notes Drawer */}
      <ReleaseNotesDrawer
        open={showReleaseNotes}
        onOpenChange={setShowReleaseNotes}
        currentVersion={appVersion}
      />
    </div>
  );
}
