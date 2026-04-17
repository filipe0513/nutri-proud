import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, ActivityLog, Category } from '@/types';

interface AppState {
  user_profile: UserProfile | null;
  activity_logs: ActivityLog[];
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => void;
  removeLog: (id: string) => void;
  resetData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user_profile: null,
      activity_logs: [],

      setProfile: (profile) => set({ user_profile: profile }),

      addLog: (log) => set((state) => ({
        activity_logs: [
          ...state.activity_logs,
          {
            ...log,
            id: uuidv4(),
            created_at: new Date().toISOString(),
          }
        ]
      })),

      removeLog: (id) => set((state) => ({
        activity_logs: state.activity_logs.filter((log) => log.id !== id)
      })),

      resetData: () => set({ user_profile: null, activity_logs: [] }),
    }),
    {
      name: 'nutri_proud_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
