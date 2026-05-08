"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { useHistoryStore } from "@/store/historyStore";
import { FilterDrawer } from "@/components/shared/FilterDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActivityLog } from "@/store/types";
import { BottomSheet_Water } from "@/components/shared/BottomSheet_Water";
import { BottomSheet_Sleep } from "@/components/shared/BottomSheet_Sleep";
import { BottomSheet_Poop } from "@/components/shared/BottomSheet_Poop";
import { MealEqualizerDrawer } from "@/components/shared/MealEqualizerDrawer";
import { WorkoutEqualizerDrawer } from "@/components/shared/WorkoutEqualizerDrawer";

const CATEGORY_ICONS: Record<string, string> = {
  water: "💧",
  food: "🥗",
  workout: "🏋️",
  sleep: "🌙",
  poop: "💩",
};

const CATEGORY_NAMES: Record<string, string> = {
  water: "Água",
  food: "Alimentação",
  workout: "Treino",
  sleep: "Sono",
  poop: "Intestino",
};

const formatGroupDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d 'de' MMMM", { locale: ptBR });
};

export default function HistoryPage() {
  const {
    logs,
    hasMore,
    isFetching,
    fetchNextPage,
    resetHistory,
    isEmptyFilters,
  } = useHistoryStore();
  const { ref, inView } = useInView();
  
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);

  const handleEdit = (log: ActivityLog) => {
    setEditingLog(log);
  };
  
  const handleClose = () => {
    setEditingLog(null);
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

  // Group logs by date
  const groupedLogs = logs.reduce(
    (acc, log) => {
      const dateKey = log.event_time.split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(log);
      return acc;
    },
    {} as Record<string, typeof logs>,
  );

  return (
    <div className="pb-24 pt-8 px-6 max-w-lg mx-auto space-y-6">
      <Image
        src="/logo-white-h.webp"
        alt="Orgulho da Nutri"
        width={1332}
        height={281}
        priority
        unoptimized
        className="h-8 w-auto drop-shadow-md mb-2"
      />
      <div className="flex items-center justify-between">
        <h1 className="text-title-1 font-bold text-neutral-500">Histórico</h1>
        <FilterDrawer />
      </div>

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
          {Object.entries(groupedLogs).map(([date, dayLogs]) => (
            <div key={date} className="space-y-3">
              <h2 className="text-title-3 font-bold text-neutral-400 capitalize">
                {formatGroupDate(date)}
              </h2>

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
                          <p className="text-caption-1 text-neutral-400">
                            {format(parseISO(log.event_time), "HH:mm")} •
                            Pontuação: {log.primary_value}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
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
        open={editingLog?.category === 'water'} 
        onOpenChange={(open) => !open && handleClose()} 
        initialData={editingLog?.category === 'water' ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
      <BottomSheet_Sleep 
        open={editingLog?.category === 'sleep'} 
        onOpenChange={(open) => !open && handleClose()} 
        initialData={editingLog?.category === 'sleep' ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
      <BottomSheet_Poop 
        open={editingLog?.category === 'poop'} 
        onOpenChange={(open) => !open && handleClose()} 
        initialData={editingLog?.category === 'poop' ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
      <MealEqualizerDrawer 
        open={editingLog?.category === 'food'} 
        onOpenChange={(open) => !open && handleClose()} 
        initialData={editingLog?.category === 'food' ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
      <WorkoutEqualizerDrawer 
        open={editingLog?.category === 'workout'} 
        onOpenChange={(open) => !open && handleClose()} 
        initialData={editingLog?.category === 'workout' ? editingLog : undefined}
        customTrigger={<div className="hidden" />}
      />
    </div>
  );
}
