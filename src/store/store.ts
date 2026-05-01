import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, ActivityLog } from './types';
import * as api from './api';

interface OnboardingData {
  name: string;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  goal: 'fat_loss' | 'muscle_gain' | 'health';
  weeklyWorkouts: number;
}

interface AppState {
  user_profile: UserProfile | null;
  activity_logs: ActivityLog[];
  
  // Actions
  saveOnboardingData: (data: OnboardingData) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  addLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => Promise<void>;
  updateLog: (id: string, log: Omit<ActivityLog, 'id' | 'created_at'>) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  setWaterToTarget: (date?: string) => Promise<void>;
  initializeData: () => Promise<void>;
  resetData: () => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
      user_profile: null,
      activity_logs: [],

      initializeData: async () => {
        const [profile, logs] = await Promise.all([
          api.fetchUserProfile(),
          api.fetchActivityLogs()
        ]);
        set({ user_profile: profile, activity_logs: logs });
      },

      saveOnboardingData: async (data: OnboardingData) => {
        const { name, weight, height, gender, goal, weeklyWorkouts } = data;
        
        // Regras de Negócio: Cálculo de metas
        const waterTarget = Math.round(weight * 35);
        let mealsTarget = 4;

        if (goal === 'muscle_gain') {
          mealsTarget = 6;
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
            weekly_workouts: weeklyWorkouts,
          },
        };

        // 1. Chama a API
        await api.saveUserProfile(profile);
        
        // 2. Atualiza estado global
        set({ user_profile: profile });
      },

      updateProfile: async (profile: UserProfile) => {
        await api.saveUserProfile(profile);
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

      updateLog: async (id, log) => {
        const existingLog = get().activity_logs.find(l => l.id === id);
        if (!existingLog) return;
        
        const updatedLog: ActivityLog = {
          ...existingLog,
          ...log,
        };

        // 1. Chama a API
        await api.updateActivityLog(id, updatedLog);

        // 2. Atualiza estado global
        set((state) => ({
          activity_logs: state.activity_logs.map(l => l.id === id ? updatedLog : l)
        }));
      },

      removeLog: async (id) => {
        // Futuro: await api.deleteActivityLog(id);
        set((state) => ({
          activity_logs: state.activity_logs.filter((log) => log.id !== id)
        }));
      },

      setWaterToTarget: async (date?: string) => {
        const state = get();
        const profile = state.user_profile;
        if (!profile) return;

        const targetMl = profile.targets.water_ml_per_day;
        const targetDate = date ?? new Date().toISOString().split('T')[0];

        // Filter out existing water logs for the target date
        const filteredLogs = state.activity_logs.filter(log => {
          if (log.category !== 'water') return true;
          const logDate = new Date(log.event_time).toISOString().split('T')[0];
          return logDate !== targetDate;
        });

        const newLog: ActivityLog = {
          id: uuidv4(),
          created_at: new Date().toISOString(),
          event_time: `${targetDate}T12:00:00.000Z`,
          category: 'water',
          primary_value: 100, // fully met
          details: { quantity_ml: targetMl }
        };

        await api.saveActivityLog(newLog);

        set({
          activity_logs: [...filteredLogs, newLog]
        });
      },

      resetData: () => set({ user_profile: null, activity_logs: [] }),
    }));
