"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppStore } from "@/store/store";
import { Flame, Menu, Settings, LogOut, Info } from "lucide-react";
import { NotificationsSheet } from "./NotificationsSheet";
import { UserAvatar } from "./UserAvatar";
import { ReleaseNotesDrawer } from "./ReleaseNotesDrawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import packageInfo from "../../../package.json";

export function StoryHeader() {
  const { user_profile } = useAppStore();
  const [streakCount, setStreakCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  const appVersion = packageInfo.version;
  const environment = process.env.NODE_ENV;

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
      {/* Top Row: Hamburger | Logo | Notifications + Avatar */}
      <div className="flex items-center justify-between">
        {/* Left: Hamburger Menu */}
        <button
          type="button"
          id="btn-hamburger-menu"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen(true)}
          className="h-10 w-10 rounded-full bg-glass-light-2 backdrop-blur-md border border-white/40 flex items-center justify-center text-neutral-500 hover:scale-105 transition-transform shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Center: Logo */}
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

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center space-x-2">
          <NotificationsSheet />
          <UserAvatar size="sm" />
        </div>
      </div>

      {/* Greeting Row */}
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

      {/* Side Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="!bg-white/95 backdrop-blur-2xl border-r border-white/40 shadow-2xl w-[300px] sm:max-w-[300px] p-0 flex flex-col"
        >
          <SheetHeader className="p-6 pb-4 border-b border-neutral-200/60">
            <div className="flex items-center space-x-3">
              <UserAvatar size="lg" />
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-title-3 text-neutral-500 truncate">
                  {user_profile?.name || "Explorador"}
                </SheetTitle>
                {user_profile?.email && (
                  <p className="text-caption-1 text-neutral-400 truncate">
                    {user_profile.email}
                  </p>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1">
            <SheetClose asChild>
              <Link
                href="/settings"
                className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-neutral-500 hover:bg-neutral-100 transition-colors"
              >
                <Settings className="h-5 w-5 text-neutral-400" />
                <span className="text-body-1 font-medium">Configurações</span>
              </Link>
            </SheetClose>
          </nav>

          {/* Footer */}
          <div className="p-4 space-y-3 border-t border-neutral-200/60">
            {/* Logout */}
            <Button
              variant="ghost"
              onClick={async () => {
                useAppStore.getState().resetData();
                document.cookie = "anon_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                await signOut({ callbackUrl: "/welcome" });
              }}
              className="w-full h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold text-body-2 flex items-center justify-center space-x-2 border border-red-500/20"
            >
              <LogOut size={18} />
              <span>Sair da Conta</span>
            </Button>

            {/* App Version */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowReleaseNotes(true);
                }}
                className="inline-flex items-center space-x-1 text-caption-1 text-neutral-400 hover:text-neutral-500 transition-colors"
              >
                <Info className="h-3 w-3" />
                <span>
                  Versão {appVersion}
                  {environment !== "production" && (
                    <span className="ml-1 text-xs">({environment})</span>
                  )}
                </span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Release Notes Drawer (rendered outside Sheet to avoid z-index issues) */}
      <ReleaseNotesDrawer
        open={showReleaseNotes}
        onOpenChange={setShowReleaseNotes}
        currentVersion={appVersion}
      />
    </div>
  );
}
