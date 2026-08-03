export interface UserProfile {
  id?: string;
  name: string;
  email?: string | null;
  image?: string | null;
  is_anonymous?: boolean;
  oneSignalId?: string | null;
  profile: {
    weight_kg: number;
    height_cm: number;
    gender: 'male' | 'female' | 'other';
    main_goal: 'fat_loss' | 'muscle_gain' | 'health';
    body_fat_percentage?: number;
  };
  targets: {
    water_ml_per_day: number;
    /** List of meal IDs the user plans to have each day */
    planned_meals: string[];
    sleep_hours_per_night: number;
    weekly_workouts: number;
  };
}

export type Category = 'water' | 'food' | 'sleep' | 'workout' | 'poop' | 'note' | 'jacada';

export interface ActivityLog {
  id: string;
  created_at: string; // ISO String
  event_time: string; // ISO String
  category: Category;
  primary_value: number; // 0 to 100
  details: {
    meal_type?: string;
    quantity_ml?: number;
    factors?: unknown;
    notes?: string;
    duration_hours?: number;
    awoke_times?: number;
    quality_feeling?: 'cansado' | 'normal' | 'revigorado' | null;
    state?: string;
    // Jacada fields
    sugar?: number;
    fat?: number;
    alcohol?: number;
    nutri_reaction?: string; // AI reaction saved after jacada registration
    // Poop analysis field
    nutri_analysis?: string; // AI analysis saved after non-normal poop registration
  };
  source?: string;
}
