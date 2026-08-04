"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useHistoryStore } from "@/store/historyStore";
import { FilterDrawer } from "@/components/shared/FilterDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActivityLog } from "@/store/types";
import { useAppStore } from "@/store/store";
import { ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { TopHeader } from "@/components/shared/TopHeader";
import { ShareReportDrawer } from "@/components/shared/ShareReportDrawer";
import { BottomSheet_Water } from "@/components/shared/BottomSheet_Water";
import { BottomSheet_Sleep } from "@/components/shared/BottomSheet_Sleep";
import { BottomSheet_Poop } from "@/components/shared/BottomSheet_Poop";
import { MealEqualizerDrawer } from "@/components/shared/MealEqualizerDrawer";
import { WorkoutEqualizerDrawer } from "@/components/shared/WorkoutEqualizerDrawer";
import { JacadaDrawer } from "@/components/shared/JacadaDrawer";
import { historyService } from "@/services/historyService";

const CATEGORY_ICONS: Record<string, string> = {
  water: "💧",
  food: "🥗",
  workout: "🏋️",
  sleep: "🌙",
  poop: "💩",
  jacada: "🍩",
};

const CATEGORY_NAMES: Record<string, string> = {
  water: "Água",
  food: "Alimentação",
  workout: "Treino",
  sleep: "Sono",
  poop: "Intestino",
  jacada: "Jacada",
};

const formatGroupDate = (dateKey: string) => {
  // dateKey is already in local YYYY-MM-DD format
  const [year, month, day] = dateKey.split('-').map(Number);
  // Build a local date at noon to avoid DST edge cases
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d 'de' MMMM", { locale: ptBR });
};

/** Returns the local date key (YYYY-MM-DD) for an ISO timestamp using browser timezone */
const getLocalDateKey = (isoString: string): string => {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function getScoreColorClass(score: number) {
  if (score <= 50) return 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-400 text-purple-600';
  if (score <= 60) return 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-400 text-red-600';
  if (score <= 70) return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-400 text-orange-600';
  if (score <= 80) return 'bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-yellow-400 text-yellow-600';
  if (score <= 90) return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400 text-blue-600';
  return 'bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-400 text-green-600';
}

export default function HistoryPage() {
  const {
    logs,
    hasMore,
    isFetching,
    fetchNextPage,
    resetHistory,
    isEmptyFilters,
  } = useHistoryStore();
  const { user_profile, initializeData } = useAppStore();
  const { ref, inView } = useInView();

  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDate, setShareDate] = useState<string>('');

  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: prev[date] === false ? true : false }));
  };

  const handleEdit = (log: ActivityLog) => {
    setEditingLog(log);
  };

  const handleClose = () => {
    setEditingLog(null);
    // Refresh the home store so stories reflect any edits/deletes without needing F5
    initializeData();
  };

  useEffect(() => {
    fetchNextPage();
    return () => resetHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inView && hasMore && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasMore, isFetching, fetchNextPage]);

  // Group logs by LOCAL date (not UTC date)
  const groupedLogs = logs.reduce(
    (acc, log) => {
      const dateKey = getLocalDateKey(log.event_time);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(log);
      return acc;
    },
    {} as Record<string, typeof logs>,
  );

  const calculateDayScore = (dayLogs: typeof logs) => {
    return historyService.calculateDayScore(dayLogs, user_profile);
  };

  return (
    <div className="pb-32 pt-24 px-6 max-w-lg mx-auto space-y-6">
      <TopHeader 
        leftAction="back" 
        title="Histórico" 
        rightElement={<FilterDrawer />} 
      />

      {logs.length === 0 && !isFetching ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-70">
          <span className="text-4xl">🔍</span>
          <p className="text-body-1 font-medium text-neutral-500">
            Nenhum registro encontrado
            {isEmptyFilters() ? "" : " para estes filtros"}.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([date, dayLogs]) => {
            const dayScore = calculateDayScore(dayLogs);
            const isExpanded = expandedDays[date] !== false; // true by default

            return (
              <div key={date} className="space-y-3">
                <div 
                  className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform select-none"
                  onClick={() => toggleDay(date)}
                >
                  <div className="flex items-center space-x-3">
                    <h2 className="text-title-3 font-bold text-neutral-400 capitalize">
                      {formatGroupDate(date)}
                    </h2>
                    <span className={`text-caption-1 font-bold px-3 py-1 rounded-full border backdrop-blur-md shadow-sm ${getScoreColorClass(dayScore)}`}>
                      Score: {Math.min(100, dayScore)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Compartilhar"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareDate(date);
                        setShareOpen(true);
                      }}
                      className="p-2 rounded-full hover:bg-neutral-200/50 text-neutral-400 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <div className="p-1 rounded-full hover:bg-neutral-200/50 text-neutral-400 transition-colors">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-3">
                    {dayLogs.map((log) => (
                      <Card
                        key={log.id}
                        className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm rounded-2xl cursor-pointer hover:bg-glass-light-2 transition-colors active:scale-[0.98]"
                        onClick={() => handleEdit(log as ActivityLog)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-white/60 flex items-center justify-center text-2xl shadow-inner">
                              {CATEGORY_ICONS[log.category] || "📌"}
                            </div>
                            <div>
                              <p className="font-bold text-body-1 text-neutral-500">
                                {CATEGORY_NAMES[log.category] || log.category}
                              </p>
                              <p className="text-caption-1 text-neutral-400 flex items-center gap-2">
                                {format(new Date(log.event_time), "HH:mm")} •
                                Pontuação: {log.primary_value}
                                {log.category === "jacada" && (log as ActivityLog).details?.nutri_reaction && (
                                  <span className="inline-flex items-center gap-1 text-orange-500 font-semibold">
                                    · 💬 Nutri reagiu
                                  </span>
                                )}
                                {log.category === "poop" && (log as ActivityLog).details?.nutri_analysis && (
                                  <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                                    · 🧠 Nutri analisou
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Elemento de Loading / Intersection Observer */}
      <div ref={ref} className="py-6 flex justify-center">
        {isFetching && (
          <div className="h-8 w-8 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
        )}
        {!hasMore && logs.length > 0 && (
          <p className="text-caption-1 text-neutral-400 font-medium">
            Você chegou ao fim do histórico.
          </p>
        )}
      </div>

      {/* Modals for editing */}
      <BottomSheet_Water
        open={editingLog?.category === "water"}
        onOpenChange={(open) => !open && handleClose()}
        initialData={editingLog?.category === "water" ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
      <BottomSheet_Sleep
        open={editingLog?.category === "sleep"}
        onOpenChange={(open) => !open && handleClose()}
        initialData={editingLog?.category === "sleep" ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
      <BottomSheet_Poop
        open={editingLog?.category === "poop"}
        onOpenChange={(open) => !open && handleClose()}
        initialData={editingLog?.category === "poop" ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
      <MealEqualizerDrawer
        open={editingLog?.category === "food"}
        onOpenChange={(open) => !open && handleClose()}
        initialData={editingLog?.category === "food" ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
      <WorkoutEqualizerDrawer
        open={editingLog?.category === "workout"}
        onOpenChange={(open) => !open && handleClose()}
        initialData={
          editingLog?.category === "workout" ? editingLog : undefined
        }
        customTrigger={<div className="hidden" />}
      />
      <ShareReportDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        type="DAILY_SCORE"
        date={shareDate || undefined}
      />
      <JacadaDrawer
        open={editingLog?.category === "jacada"}
        onOpenChange={(open) => !open && handleClose()}
        initialData={editingLog?.category === "jacada" ? editingLog : undefined}
      />
    </div>
  );
}
