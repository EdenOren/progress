import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../config/env';

/**
 * Database schema type for Supabase client.
 * Generated structure matching Supabase JS v2 requirements.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      domains: {
        Row: {
          id: string;
          key: string;
          name: string;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          key?: string;
          name?: string;
          icon?: string | null;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          user_id: string;
          domain_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          default_sets: Array<{ target_reps?: number; target_duration_seconds?: number }>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          default_sets?: Array<{ target_reps?: number; target_duration_seconds?: number }>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          is_active?: boolean;
          default_sets?: Array<{ target_reps?: number; target_duration_seconds?: number }>;
          updated_at?: string;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          performed_at: string;
          notes: string | null;
          is_completed: boolean;
          duration_seconds: number | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          performed_at: string;
          notes?: string | null;
          is_completed?: boolean;
          duration_seconds?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          performed_at?: string;
          notes?: string | null;
          is_completed?: boolean;
          duration_seconds?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          name: string;
          position: number;
          exercise_id: string | null;
          is_from_template: boolean;
          tracking_type: 'weight_reps' | 'duration' | 'distance';
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          user_id: string;
          name: string;
          position: number;
          exercise_id?: string | null;
          is_from_template?: boolean;
          tracking_type?: 'weight_reps' | 'duration' | 'distance';
          note?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          position?: number;
          exercise_id?: string | null;
          is_from_template?: boolean;
          tracking_type?: 'weight_reps' | 'duration' | 'distance';
          note?: string | null;
        };
        Relationships: [];
      };
      item_sets: {
        Row: {
          id: string;
          item_id: string;
          user_id: string;
          set_index: number;
          weight_kg: number | null;
          reps: number | null;
          duration_sec: number | null;
          distance_m: number | null;
          target_reps: number | null;
          target_duration_sec: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          user_id: string;
          set_index: number;
          weight_kg?: number | null;
          reps?: number | null;
          duration_sec?: number | null;
          distance_m?: number | null;
          target_reps?: number | null;
          target_duration_sec?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          set_index?: number;
          weight_kg?: number | null;
          reps?: number | null;
          duration_sec?: number | null;
          distance_m?: number | null;
          target_reps?: number | null;
          target_duration_sec?: number | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      item_feedback: {
        Row: {
          id: string;
          item_id: string;
          user_id: string;
          rating: 'done' | 'up';
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          user_id: string;
          rating: 'done' | 'up';
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          rating?: 'done' | 'up';
          comment?: string | null;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          item_name: string;
          target: Record<string, unknown>;
          achieved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          item_name: string;
          target: Record<string, unknown>;
          achieved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          item_name?: string;
          target?: Record<string, unknown>;
          achieved_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          enabled_modules: string[];
          module_settings: Record<string, unknown>;
          active_module: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          enabled_modules?: string[];
          module_settings?: Record<string, unknown>;
          active_module?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          enabled_modules?: string[];
          module_settings?: Record<string, unknown>;
          active_module?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercise_library: {
        Row: {
          id: string;
          name: string;
          icon: string;
          category: string;
          muscle_group: string;
          tracking_type: 'weight_reps' | 'duration' | 'distance';
          is_system: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          category: string;
          muscle_group: string;
          tracking_type?: 'weight_reps' | 'duration' | 'distance';
          is_system?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          category?: string;
          muscle_group?: string;
          tracking_type?: 'weight_reps' | 'duration' | 'distance';
          is_system?: boolean;
          created_by?: string | null;
        };
        Relationships: [];
      };
      workout_templates: {
        Row: {
          id: string;
          subject_id: string;
          exercise_id: string;
          position: number;
          default_sets: Array<{ target_reps?: number; target_duration_seconds?: number }>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          exercise_id: string;
          position: number;
          default_sets?: Array<{ target_reps?: number; target_duration_seconds?: number }>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subject_id?: string;
          exercise_id?: string;
          position?: number;
          default_sets?: Array<{ target_reps?: number; target_duration_seconds?: number }>;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      feedback_rating: 'done' | 'up';
      tracking_type: 'weight_reps' | 'duration' | 'distance';
      exercise_category: 'strength' | 'bodyweight' | 'cardio' | 'flexibility' | 'yoga' | 'pilates';
      muscle_group: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full_body';
    };
    CompositeTypes: Record<string, never>;
  };
}

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Initialize the Supabase client.
 * Must be called once at app startup with validated environment.
 *
 * @example
 * ```typescript
 * import { initSupabase, validateEnv } from '@progress/shared';
 *
 * const env = validateEnv({
 *   SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
 *   SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
 * });
 *
 * initSupabase(env);
 * ```
 */
export function initSupabase(env: Env): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // For React Native
    },
  });

  return supabaseInstance;
}

/**
 * Get the initialized Supabase client.
 * Throws if initSupabase hasn't been called.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase client not initialized. Call initSupabase(env) first.'
    );
  }
  return supabaseInstance;
}

/**
 * Check if Supabase client is initialized
 */
export function isSupabaseInitialized(): boolean {
  return supabaseInstance !== null;
}

/**
 * Reset Supabase client (useful for testing)
 */
export function resetSupabase(): void {
  supabaseInstance = null;
}
