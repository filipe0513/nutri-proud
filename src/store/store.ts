import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, ActivityLog } from './types';
import * as api from './api';

interface OnboardingData {
  name: string;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  goal: 'fat_loss' | 'muscle_gain' | 'health';
}

interface AppState {
  user_profile: UserProfile | null;
  activity_logs: ActivityLog[];
  
  // Actions
  saveOnboardingData: (data: OnboardingData) => Promise<void>;
  addLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  resetData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user_profile: null,
      activity_logs: [],

      saveOnboardingData: async (data: OnboardingData) => {
        const { name, weight, height, gender, goal } = data;
        
        // Regras de Negócio: Cálculo de metas
        const waterTarget = Math.round(weight * 35);
        let mealsTarget = 4;
        let cardioTarget = 3;
        let strengthTarget = 3;
        
        if (goal === 'fat_loss') {
          mealsTarget = 4;
          cardioTarget = 5;
          strengthTarget = 3;
        } else if (goal === 'muscle_gain') {
          mealsTarget = 6;
          cardioTarget = 2;
          strengthTarget = 4;
        } else {
          mealsTarget = 4;
          cardioTarget = 3;
          strengthTarget = 3;
        }
        
        const profile: UserProfile = {
          name,
          profile: {
            weight_kg: weight,
            height_cm: height,
            gender,
            main_goal: goal,
          },
          targets: {
            water_ml_per_day: waterTarget,
            meals_per_day: mealsTarget,
            sleep_hours_per_night: 7.5,
            weekly_workouts: { cardio: cardioTarget, strength: strengthTarget },
          },
        };

        // 1. Chama a API
        await api.saveUserProfile(profile);
        
        // 2. Atualiza estado global
        set({ user_profile: profile });
      },

      addLog: async (log) => {
        const newLog: ActivityLog = {
          ...log,
          id: uuidv4(),
          created_at: new Date().toISOString(),
        };

        // 1. Chama a API
        await api.saveActivityLog(newLog);

        // 2. Atualiza estado global
        set((state) => ({
          activity_logs: [...state.activity_logs, newLog]
        }));
      },

      removeLog: async (id) => {
        // Futuro: await api.deleteActivityLog(id);
        set((state) => ({
          activity_logs: state.activity_logs.filter((log) => log.id !== id)
        }));
      },

      resetData: () => set({ user_profile: null, activity_logs: [] }),
    }),
    {
      name: 'nutri_proud_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
