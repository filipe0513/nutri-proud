import { create } from "zustand";
import { ActivityLog, Category } from "./types";

interface FilterState {
  startDate: string | null;
  endDate: string | null;
  categories: Category[];
}

interface HistoryState {
  logs: ActivityLog[];
  page: number;
  hasMore: boolean;
  isFetching: boolean;
  filters: FilterState;

  fetchNextPage: () => Promise<void>;
  applyFilters: (filters: FilterState) => Promise<void>;
  resetHistory: () => void;
  updateLogHistory: (id: string, updatedLog: Partial<ActivityLog>) => void;
  deleteLogHistory: (id: string) => void;
  isEmptyFilters: () => boolean;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  logs: [],
  page: 1,
  hasMore: true,
  isFetching: false,
  filters: {
    startDate: null,
    endDate: null,
    categories: [],
  },

  fetchNextPage: async () => {
    const { page, hasMore, isFetching, filters, logs } = get();

    if (!hasMore || isFetching) return;

    set({ isFetching: true });

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");

      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.categories.length > 0) {
        params.set("categories", filters.categories.join(","));
      }

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      set({
        logs: [...logs, ...(data.logs || [])],
        page: page + 1,
        hasMore: data.hasMore ?? false,
        isFetching: false,
      });
    } catch (error) {
      console.error("Falha ao buscar histórico", error);
      set({ isFetching: false });
    }
  },

  applyFilters: async (newFilters: FilterState) => {
    // Limpa estado, aplica novos filtros e busca página 1
    set({
      logs: [],
      page: 1,
      hasMore: true,
      filters: newFilters,
    });
    // Precisamos buscar imediatamente após atualizar o state
    await get().fetchNextPage();
  },

  resetHistory: () => {
    set({
      logs: [],
      page: 1,
      hasMore: true,
      isFetching: false,
      filters: { startDate: null, endDate: null, categories: [] },
    });
  },

  updateLogHistory: (id, updatedLog) => {
    set((state) => ({
      logs: state.logs.map((log) => 
        log.id === id ? { ...log, ...updatedLog } as ActivityLog : log
      )
    }));
  },

  deleteLogHistory: (id) => {
    set((state) => ({
      logs: state.logs.filter((log) => log.id !== id)
    }));
  },

  isEmptyFilters: () => {
    const { filters } = get();
    return (
      !filters.startDate && !filters.endDate && filters.categories.length === 0
    );
  },
}));
