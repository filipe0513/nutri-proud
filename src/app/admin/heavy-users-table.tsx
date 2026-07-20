"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpDown, ChevronRight, Activity, CalendarDays, Droplets, Moon, Coffee, Dumbbell } from "lucide-react";
import { getAdminUserLogs } from "./actions";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type TopUser = {
  id: string;
  email: string | null;
  name: string | null;
  is_anonymous: boolean;
  createdAt: Date;
  _count: { logs: number };
  logs: { createdAt: Date }[];
};

type SortKey = "user" | "name" | "status" | "createdAt" | "lastLog" | "totalLogs";
type SortDirection = "asc" | "desc";

type LogItem = {
  id: string;
  category: string;
  eventTime: Date;
  createdAt: Date;
  primaryValue: number;
};

function SortableHeader({ 
  title, 
  sortKey, 
  currentSortKey, 
  handleSort 
}: { 
  title: string; 
  sortKey: SortKey; 
  currentSortKey: SortKey | null; 
  handleSort: (key: SortKey) => void;
}) {
  return (
    <th 
      scope="col" 
      className="px-6 py-3 cursor-pointer hover:bg-neutral-200/50 transition-colors"
      onClick={() => handleSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${sortKey === "totalLogs" ? "justify-end" : ""}`}>
        {title}
        <ArrowUpDown className={`w-3 h-3 ${currentSortKey === sortKey ? "text-neutral-700" : "text-neutral-400"}`} />
      </div>
    </th>
  );
}

export function HeavyUsersTable({ initialData }: { initialData: TopUser[] }) {
  const [data, setData] = useState<TopUser[]>(initialData);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Estados do Histórico
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userLogs, setUserLogs] = useState<LogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "desc";
    if (sortKey === key && sortDirection === "desc") {
      direction = "asc";
    }
    setSortKey(key);
    setSortDirection(direction);

    const sorted = [...data].sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      switch (key) {
        case "user":
          valA = a.email || (a.is_anonymous ? "Usuário Anônimo" : "Sem E-mail");
          valB = b.email || (b.is_anonymous ? "Usuário Anônimo" : "Sem E-mail");
          break;
        case "name":
          valA = a.name || "";
          valB = b.name || "";
          break;
        case "status":
          valA = a.is_anonymous ? 0 : 1;
          valB = b.is_anonymous ? 0 : 1;
          break;
        case "createdAt":
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case "lastLog":
          valA = a.logs.length > 0 ? new Date(a.logs[0].createdAt).getTime() : 0;
          valB = b.logs.length > 0 ? new Date(b.logs[0].createdAt).getTime() : 0;
          break;
        case "totalLogs":
          valA = a._count.logs;
          valB = b._count.logs;
          break;
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setData(sorted);
  };

  const openHistory = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingLogs(true);
    setUserLogs([]); // limpa logs antigos

    try {
      const logs = await getAdminUserLogs(userId);
      setUserLogs(logs);
    } catch (error) {
      console.error("Erro ao buscar logs", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toUpperCase()) {
      case "WATER": return <Droplets className="w-4 h-4 text-blue-500" />;
      case "SLEEP": return <Moon className="w-4 h-4 text-indigo-500" />;
      case "FOOD": return <Coffee className="w-4 h-4 text-orange-500" />;
      case "WORKOUT": return <Dumbbell className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-neutral-500" />;
    }
  };

  const selectedUser = data.find(u => u.id === selectedUserId);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-500 uppercase bg-neutral-100/50 border-y border-neutral-200 select-none">
            <tr>
              <SortableHeader title="Usuário" sortKey="user" currentSortKey={sortKey} handleSort={handleSort} />
              <SortableHeader title="Nome" sortKey="name" currentSortKey={sortKey} handleSort={handleSort} />
              <SortableHeader title="Status" sortKey="status" currentSortKey={sortKey} handleSort={handleSort} />
              <SortableHeader title="Entrou em" sortKey="createdAt" currentSortKey={sortKey} handleSort={handleSort} />
              <SortableHeader title="Último Registro" sortKey="lastLog" currentSortKey={sortKey} handleSort={handleSort} />
              <SortableHeader title="Total Logs" sortKey="totalLogs" currentSortKey={sortKey} handleSort={handleSort} />
              <th scope="col" className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u, i) => (
              <tr key={u.id} className="bg-white/30 border-b border-neutral-100 last:border-0 hover:bg-white/50 transition-colors">
                <td className="px-6 py-4 font-medium text-neutral-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs text-neutral-500 font-bold shrink-0">
                    {i + 1}
                  </div>
                  <span className="truncate max-w-[200px]">
                    {u.email || (u.is_anonymous ? 'Usuário Anônimo' : 'Sem E-mail')}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-600">
                  {u.name || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${u.is_anonymous ? 'bg-notify-warning-glass text-notify-warning border border-notify-warning/20' : 'bg-notify-success-glass text-notify-success border border-notify-success/20'}`}>
                    {u.is_anonymous ? 'Anônimo' : 'Registrado'}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                  {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </td>
                <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                  {u.logs.length > 0 
                    ? format(new Date(u.logs[0].createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : 'Nenhum'}
                </td>
                <td className="px-6 py-4 text-right font-bold text-neutral-700">
                  {u._count.logs}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-neutral-500 hover:text-neutral-900 h-8 px-2"
                    onClick={() => openHistory(u.id)}
                  >
                    Ver Histórico
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent className="bg-glass-light-3 backdrop-blur-lg sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-title-3 font-bold text-neutral-800">
              Histórico de Hábitos
            </SheetTitle>
            <SheetDescription>
              Últimos 50 registros de {selectedUser?.name || selectedUser?.email || "Usuário"}.
            </SheetDescription>
          </SheetHeader>

          {isLoadingLogs ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Activity className="w-6 h-6 text-neutral-400 animate-spin" />
              <span className="text-sm text-neutral-500">Buscando registros...</span>
            </div>
          ) : userLogs.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-sm">
              Nenhum registro encontrado.
            </div>
          ) : (
            <div className="space-y-4">
              {userLogs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 rounded-xl bg-white/50 border border-white/60">
                  <div className="mt-1">
                    {getCategoryIcon(log.category)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-neutral-800 capitalize">
                        {log.category.toLowerCase()}
                      </p>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(log.eventTime || log.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600 flex items-center justify-between">
                      <span className="truncate">
                         Pontuação gerada: {log.primaryValue}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
