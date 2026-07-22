import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, ActivityLog } from './types';
import * as api from './api';
import { toLocalISOString } from '@/lib/utils';

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
  addLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => Promise<ActivityLog>;
  updateLog: (id: string, log: Omit<ActivityLog, 'id' | 'created_at'>) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  setWaterToTarget: (date?: string, source?: string) => Promise<void>;
  initializeData: () => Promise<void>;
  resetData: () => void;
  
  // UI State
  isAddLogOpen: boolean;
  setAddLogOpen: (isOpen: boolean) => void;
  activeDrawer: 'water' | 'meal' | 'workout' | 'sleep' | 'poop' | 'note' | 'jacada' | 'lifesaver' | 'insights' | null;
  activeDrawerSource: string;
  setActiveDrawer: (drawer: 'water' | 'meal' | 'workout' | 'sleep' | 'poop' | 'note' | 'jacada' | 'lifesaver' | 'insights' | null, source?: string) => void;
  setActiveDrawerSource: (source: string | null) => void;
  /** Dados transitórios de insight para abrir o InsightsDrawer programaticamente (ex: via notificações) */
  pendingInsightData: { message: string; cta: string | null } | null;
  setPendingInsightData: (data: { message: string; cta: string | null } | null) => void;

  /** Success Overlay (Full Screen Toast) */
  successOverlay: { isOpen: boolean; message: string; submessage?: string; category?: string } | null;
  showSuccessOverlay: (data: { message: string; submessage?: string; category?: string }) => void;
  hideSuccessOverlay: () => void;

  /** Animação condicional para Squircle (Streak) após log */
  justLoggedAnimate: boolean;
  setJustLoggedAnimate: (animate: boolean) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
      user_profile: null,
      activity_logs: [],
      
      isAddLogOpen: false,
      setAddLogOpen: (isOpen) => set({ isAddLogOpen: isOpen }),
      activeDrawer: null,
      activeDrawerSource: 'UNKNOWN',
      setActiveDrawer: (drawer, source) => set({ activeDrawer: drawer, activeDrawerSource: source || 'UNKNOWN' }),
      setActiveDrawerSource: (source) => set({ activeDrawerSource: source || 'UNKNOWN' }),
      pendingInsightData: null,
      setPendingInsightData: (data) => set({ pendingInsightData: data }),
      successOverlay: null,
      justLoggedAnimate: false,
      setJustLoggedAnimate: (animate) => set({ justLoggedAnimate: animate }),
      showSuccessOverlay: (data) => {
        set({ successOverlay: { isOpen: true, ...data } });
        setTimeout(() => {
          set((state) => {
            if (state.successOverlay?.isOpen) {
              return { successOverlay: null, justLoggedAnimate: true };
            }
            return state;
          });
        }, 1500);
      },
      hideSuccessOverlay: () => set({ successOverlay: null }),

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

        // Default planned meals based on goal
        const defaultPlannedMeals =
          goal === 'muscle_gain'
            ? ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'pre_workout', 'dinner']
            : ['breakfast', 'lunch', 'afternoon_snack', 'dinner', 'supper'];
        
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
            planned_meals: defaultPlannedMeals,
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

        // 2. Atualiza estado global (mantém ordem decrescente por event_time)
        set((state) => ({
          activity_logs: [...state.activity_logs, newLog].sort(
            (a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
          ),
        }));

        return newLog;
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
        await api.deleteActivityLog(id);
        set((state) => ({
          activity_logs: state.activity_logs.filter((log) => log.id !== id)
        }));
      },

      setWaterToTarget: async (date?: string, source?: string) => {
        const state = get();
        const profile = state.user_profile;
        if (!profile) return;

        const targetMl = profile.targets?.water_ml_per_day || 2000;
        const eventTime = date ? toLocalISOString(new Date(date)) : toLocalISOString(new Date());
        const targetDate = eventTime.split('T')[0];

        // Filter out existing water logs for the target date
        const filteredLogs = state.activity_logs.filter(log => {
          if (log.category !== 'water') return true;
          const logDate = log.event_time.split('T')[0];
          return logDate !== targetDate;
        });

        const newLog: ActivityLog = {
          id: uuidv4(),
          created_at: new Date().toISOString(),
          event_time: eventTime,
          category: 'water',
          primary_value: 100, // fully met
          details: { quantity_ml: targetMl },
          source,
        };

        await api.saveActivityLog(newLog);

        set({
          activity_logs: [...filteredLogs, newLog]
        });
      },

      resetData: () => set({ user_profile: null, activity_logs: [] }),
    }));
